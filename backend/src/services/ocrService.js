import { createRequire } from 'module';
import { geminiService } from './geminiService.js';
import {
  BillExtractionError,
  parseBillText,
  normalizeAiExtraction,
  mergeExtractions,
  finalizeExtraction,
  emptyExtraction,
  hasUsableBillText,
  isTextExtractionSufficient,
} from './billParser.js';

const require = createRequire(import.meta.url);
let pdfModule = null;

try {
  pdfModule = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse load notice:', e.message);
}

const AI_FAILURE_MESSAGES = {
  AUTH: 'AI OCR authentication failed on the server. Check the GEMINI_API_KEY configuration, or enter the bill details manually.',
  QUOTA: 'AI OCR quota is temporarily exhausted. Try again later, or enter the bill details manually.',
  TRANSIENT: 'The AI OCR service is temporarily unavailable. Try again later, or enter the bill details manually.',
  TIMEOUT: 'AI OCR timed out while reading this document. Try again, or enter the bill details manually.',
  UNAVAILABLE: 'The configured AI OCR model is unavailable. Try again later, or enter the bill details manually.',
  INVALID: 'The AI OCR service rejected this document request. Verify the file and try again.',
  MALFORMED_JSON: 'The AI OCR response was malformed. Enter the bill details manually.',
  UNKNOWN: 'AI OCR could not read this document. Enter the bill details manually.',
};

function aiFailureMessage(kind) {
  return AI_FAILURE_MESSAGES[kind] || AI_FAILURE_MESSAGES.UNKNOWN;
}

export const ocrService = {
  /**
   * Extract raw text from a PDF buffer (supports pdf-parse v1 and v2)
   * @param {Buffer} buffer 
   * @returns {Promise<string>}
   */
  async extractTextFromPdf(buffer) {
    if (!pdfModule || !buffer) return '';
    try {
      // 1. pdf-parse v1 compatibility (direct callable function)
      if (typeof pdfModule === 'function') {
        const data = await pdfModule(buffer);
        return data.text || '';
      }
      // 2. pdf-parse v2+ compatibility (PDFParse class)
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        try {
          const res = await parser.getText();
          if (typeof res === 'string') return res;
          if (res && typeof res.text === 'string') return res.text;
          return '';
        } finally {
          if (typeof parser.destroy === 'function') {
            await parser.destroy().catch(() => {});
          }
        }
      }
      return '';
    } catch (err) {
      console.warn('PDF text extraction error:', err.message);
      return '';
    }
  },

  /**
   * Process an electricity bill document.
   *
   * Strategy:
   * 1. Text PDFs: parse embedded text deterministically. If the result is
   *    sufficient, do not send the file to Gemini.
   * 2. Scanned PDFs and images: use Gemini document/image understanding.
   * 3. Text PDFs with incomplete local extraction: send the file plus the
   *    locally extracted text to Gemini, then merge with conflict warnings.
   * 4. If Gemini fails, keep deterministic results only. Never fabricate.
   *
   * @param {Object} params
   * @param {Buffer} params.fileBuffer
   * @param {string} params.mimeType
   * @param {string} params.fileName
   */
  async processBillDocument({ fileBuffer, mimeType, fileName = '' }) {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new BillExtractionError('The uploaded file is empty.', {
        statusCode: 400,
        code: 'EMPTY_FILE',
      });
    }

    const isPdf = mimeType === 'application/pdf';
    const isImage = typeof mimeType === 'string' && mimeType.startsWith('image/');
    if (!isPdf && !isImage) {
      throw new BillExtractionError('Only PDF, JPG/JPEG and PNG bill files are supported.', {
        statusCode: 415,
        code: 'UNSUPPORTED_FILE_TYPE',
      });
    }

    let rawText = '';
    if (isPdf) {
      rawText = await this.extractTextFromPdf(fileBuffer);
    }

    const hasText = isPdf && hasUsableBillText(rawText);
    const localExtraction = hasText ? parseBillText(rawText, fileName) : null;
    const localSufficient = Boolean(localExtraction && isTextExtractionSufficient(localExtraction));

    let extraction = null;
    let sourceEngine = 'NONE';
    let aiModelUsed = null;
    let aiWarning = null;

    if (localSufficient) {
      extraction = localExtraction;
      sourceEngine = 'LOCAL_PDF_TEXT';
    } else if (geminiService.isConfigured()) {
      try {
        const { data, model } = await geminiService.extractStructuredBillWithGemini({
          fileBuffer,
          mimeType,
          rawText,
          includeFile: true,
        });

        if (data) {
          const aiExtraction = normalizeAiExtraction(data);
          aiModelUsed = model;
          if (localExtraction) {
            extraction = mergeExtractions(aiExtraction, localExtraction);
            sourceEngine = `GEMINI_VISION+LOCAL_TEXT (${model})`;
          } else {
            extraction = aiExtraction;
            sourceEngine = isPdf ? `GEMINI_PDF_VISION (${model})` : `GEMINI_IMAGE_VISION (${model})`;
          }
        } else {
          extraction = localExtraction || emptyExtraction('NO_AI');
          sourceEngine = localExtraction ? 'LOCAL_PDF_TEXT' : 'NO_AI';
        }
      } catch (error) {
        extraction = localExtraction || emptyExtraction('GEMINI_FAILED');
        sourceEngine = localExtraction ? 'LOCAL_PDF_TEXT (AI unavailable)' : 'GEMINI_FAILED';
        aiWarning = aiFailureMessage(error.kind);
      }
    } else {
      extraction = localExtraction || emptyExtraction('NO_AI');
      sourceEngine = localExtraction ? 'LOCAL_PDF_TEXT' : 'NO_AI';
      aiWarning = 'AI OCR is not configured on the server. Enter the bill details manually.';
    }

    if (aiWarning) {
      extraction.warnings = [...(extraction.warnings || []), aiWarning];
    }

    return finalizeExtraction({
      extraction,
      sourceEngine,
      aiModelUsed,
      rawTextLength: rawText.length,
      fileName,
    });
  },

};

export default ocrService;
