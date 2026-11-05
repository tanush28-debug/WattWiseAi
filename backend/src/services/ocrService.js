import { createRequire } from 'module';
import { geminiService } from './geminiService.js';

const require = createRequire(import.meta.url);
let pdfModule = null;

try {
  pdfModule = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse load notice:', e.message);
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
   * Process and parse an electricity bill document
   * Extracts ONLY real values from the document. Never produces dummy or demo details.
   * @param {Object} params
   * @param {Buffer} params.fileBuffer
   * @param {string} params.mimeType
   * @param {string} params.fileName
   */
  async processBillDocument({ fileBuffer, mimeType, fileName }) {
    let rawText = '';
    const isPdf = mimeType === 'application/pdf';

    if (isPdf && fileBuffer) {
      rawText = await this.extractTextFromPdf(fileBuffer);
    }

    // 1. Attempt AI Vision & Multimodal Extraction first with Google Gemini
    let geminiExtracted = null;
    if (geminiService.isConfigured()) {
      geminiExtracted = await geminiService.extractStructuredBillWithGemini({
        fileBuffer,
        mimeType,
        rawText,
      });
    }

    if (geminiExtracted && (geminiExtracted.unitsConsumed != null || geminiExtracted.totalAmount != null || geminiExtracted.accountNumber != null)) {
      return this.validateAndFinalizeExtraction(geminiExtracted, `GEMINI_AI_VISION (${geminiExtracted.aiModelUsed || 'Cloud AI'})`);
    }

    // 2. Parse embedded text from document using strict regex heuristics
    const parsedFromText = this.parseWithHeuristics(rawText, fileName);
    return this.validateAndFinalizeExtraction(
      parsedFromText,
      rawText.length > 30 ? 'EMBEDDED_PDF_TEXT_PARSER' : 'DOCUMENT_OCR_SCANNER'
    );
  },

  /**
   * Parse Indian electricity bill text using strict regex pattern matching.
   * Extracts ONLY data present in the text. Does NOT invent dummy numbers or names.
   * @param {string} text 
   * @param {string} fileName 
   */
  parseWithHeuristics(text = '', fileName = '') {
    if (!text || text.trim().length === 0) {
      return {
        accountNumber: null,
        consumerName: null,
        discom: null,
        billingPeriod: null,
        billingMonth: null,
        billDate: null,
        dueDate: null,
        previousReading: null,
        currentReading: null,
        unitsConsumed: null,
        fixedCharges: null,
        energyCharges: null,
        fuelAdjustments: null,
        taxes: null,
        subsidies: null,
        totalAmount: null,
        tariffCategory: null,
        confidenceScore: 0.0,
        unextractedNotice: 'No machine-readable text was detected in the document. Please verify or input your bill details manually.',
      };
    }

    // 1. Account / Consumer ID Patterns (e.g. Account No: 10293847, Consumer ID: 849201948)
    const accountMatch = text.match(/(?:Account\s*(?:No|Number|#)|Consumer\s*(?:No|Number|ID)|CA\s*No|RR\s*No|K-Number|Service\s*(?:No|Number))[\s.:#\-]+([A-Z0-9\/\-]{6,16})/i);
    const accountNumber = accountMatch ? accountMatch[1].trim() : null;

    // 2. Units Consumed Patterns (e.g. Units Billed: 420.5, Total kWh: 380, Consumption: 250)
    const unitsMatch = text.match(/(?:Units\s*(?:Consumed|Billed|Total)|Billed\s*Units|Total\s*(?:kWh|Units)|Net\s*Units|Consumption\s*(?:\(kWh\)|\(Units\)|Units)?)[\s.:#\-]+([0-9]+(?:\.[0-9]+)?)/i);
    const unitsConsumed = unitsMatch ? parseFloat(unitsMatch[1]) : null;

    // 3. Net Payable Total Amount Patterns (e.g. Net Amount Due: 3248.50, Total Payable: ₹4,120)
    const totalMatch = text.match(/(?:Net\s*Amount\s*(?:Payable|Due)|Total\s*Amount\s*(?:Payable|Due)|Bill\s*Amount|Total\s*Payable|Gross\s*Amount|Current\s*Bill\s*Amount)[\s.:#\-]+[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)/i);
    let totalAmount = null;
    if (totalMatch) {
      const cleanTotal = totalMatch[1].replace(/,/g, '');
      totalAmount = parseFloat(cleanTotal);
    }

    // 4. Due Date Patterns (e.g. Due Date: 15/11/2026 or 15-Nov-2026)
    const dueDateMatch = text.match(/(?:Due\s*Date|Payment\s*Due(?:\s*Date)?|Pay\s*By|Pay\s*Before)[\s.:#\-]+([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{2,4}|[0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})/i);
    const dueDate = dueDateMatch ? dueDateMatch[1].trim() : null;

    // 5. Billing Month / Period Patterns (e.g. October 2026 or Billing Month: Sep-Oct 2026)
    const monthMatch = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20[2-3][0-9])\b/i);
    const billingMonth = monthMatch ? `${monthMatch[1]} ${monthMatch[2]}` : null;

    const periodMatch = text.match(/(?:Billing\s*Period|Bill\s*Period|Cycle)[\s.:#\-]+([^\n\r,]+)/i);
    const billingPeriod = periodMatch ? periodMatch[1].trim() : null;

    // 6. Consumer Name Patterns
    const nameMatch = text.match(/(?:Consumer\s*Name|Customer\s*Name|Name\s*of\s*Consumer)[\s.:#\-]+([A-Za-z\s\.\,\'\-]+?)(?:\r?\n|$)/i);
    const consumerName = nameMatch && nameMatch[1].trim().length > 2 ? nameMatch[1].trim() : null;

    // 7. DISCOM Identification
    let discom = null;
    if (/BESCOM/i.test(text)) discom = 'BESCOM (Bangalore Electricity Supply Company)';
    else if (/MESCOM/i.test(text)) discom = 'MESCOM (Mangalore Electricity Supply Company)';
    else if (/HESCOM/i.test(text)) discom = 'HESCOM (Hubli Electricity Supply Company)';
    else if (/GESCOM/i.test(text)) discom = 'GESCOM (Gulbarga Electricity Supply Company)';
    else if (/TATA\s*POWER/i.test(text)) discom = 'Tata Power';
    else if (/ADANI\s*ELECTRICITY/i.test(text)) discom = 'Adani Electricity';
    else if (/MAHADISCOM|MSEDCL/i.test(text)) discom = 'MSEDCL (Mahavitaran)';
    else if (/BSES/i.test(text)) discom = 'BSES Delhi';

    // 8. Tariff Classification
    let tariffCategory = null;
    if (/LT-?1|Domestic|Residential/i.test(text)) tariffCategory = 'Domestic LT-1 Standard';
    else if (/LT-?2|Commercial/i.test(text)) tariffCategory = 'Commercial LT-2';
    else if (/HT-?2|Industrial/i.test(text)) tariffCategory = 'Industrial HT-2a';
    else if (/KUSUM|Agricultural/i.test(text)) tariffCategory = 'Agricultural PM-KUSUM';

    // 9. Itemized Breakdown Charges (Only if explicitly in text)
    const energyMatch = text.match(/(?:Energy\s*Charges|EC)[\s.:#\-]+[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)/i);
    const fixedMatch = text.match(/(?:Fixed\s*Charges|Standing\s*Charges|FC)[\s.:#\-]+[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)/i);
    const fuelMatch = text.match(/(?:Fuel\s*(?:Surcharge|Adjustment)|FPPCA|FAC)[\s.:#\-]+[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)/i);
    const taxMatch = text.match(/(?:Electricity\s*Duty|Duty|Tax|ED)[\s.:#\-]+[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)/i);

    const energyCharges = energyMatch ? parseFloat(energyMatch[1].replace(/,/g, '')) : null;
    const fixedCharges = fixedMatch ? parseFloat(fixedMatch[1].replace(/,/g, '')) : null;
    const fuelAdjustments = fuelMatch ? parseFloat(fuelMatch[1].replace(/,/g, '')) : null;
    const taxes = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : null;

    // Compute confidence based on how many real required fields were detected
    let detectedCount = 0;
    if (unitsConsumed != null) detectedCount += 2;
    if (totalAmount != null) detectedCount += 2;
    if (accountNumber != null) detectedCount += 1;
    if (dueDate != null) detectedCount += 1;
    if (billingMonth != null) detectedCount += 1;

    const confidenceScore = Math.min(0.95, parseFloat((detectedCount / 7.0).toFixed(2)));

    return {
      accountNumber,
      consumerName,
      discom,
      billingPeriod,
      billingMonth,
      billDate: null,
      dueDate,
      previousReading: null,
      currentReading: null,
      unitsConsumed,
      fixedCharges,
      energyCharges,
      fuelAdjustments,
      taxes,
      subsidies: null,
      totalAmount,
      tariffCategory,
      confidenceScore,
    };
  },

  /**
   * Validate arithmetic consistency and flag missing or uncertain fields
   */
  validateAndFinalizeExtraction(extracted, sourceEngine) {
    const units = extracted.unitsConsumed != null ? Number(extracted.unitsConsumed) : null;
    const totalAmount = extracted.totalAmount != null ? Number(extracted.totalAmount) : null;
    const energy = extracted.energyCharges != null ? Number(extracted.energyCharges) : null;
    const fixed = extracted.fixedCharges != null ? Number(extracted.fixedCharges) : null;
    const fuel = extracted.fuelAdjustments != null ? Number(extracted.fuelAdjustments) : null;
    const tax = extracted.taxes != null ? Number(extracted.taxes) : null;
    const subsidy = extracted.subsidies != null ? Number(extracted.subsidies) : 0;

    let isArithmeticConsistent = false;
    let calculatedSum = null;
    let discrepancy = null;

    if (energy != null && fixed != null && totalAmount != null) {
      calculatedSum = parseFloat(((energy || 0) + (fixed || 0) + (fuel || 0) + (tax || 0) - (subsidy || 0)).toFixed(2));
      discrepancy = parseFloat(Math.abs(calculatedSum - totalAmount).toFixed(2));
      isArithmeticConsistent = discrepancy <= 2.50;
    }

    const uncertainFields = [];
    if (!extracted.accountNumber) uncertainFields.push('accountNumber');
    if (extracted.unitsConsumed == null) uncertainFields.push('unitsConsumed');
    if (extracted.totalAmount == null) uncertainFields.push('totalAmount');
    if (!extracted.dueDate) uncertainFields.push('dueDate');
    if (!extracted.billingMonth) uncertainFields.push('billingMonth');

    const hasCoreDetails = extracted.unitsConsumed != null && extracted.totalAmount != null;

    return {
      ...extracted,
      sourceEngine,
      validation: {
        hasCoreDetails,
        isArithmeticConsistent,
        calculatedSum,
        recordedTotal: totalAmount,
        discrepancyINR: discrepancy,
        uncertainFields,
        status: hasCoreDetails 
          ? (isArithmeticConsistent ? 'HIGH_CONFIDENCE' : 'MODERATE_CONFIDENCE') 
          : 'MANUAL_ENTRY_REQUIRED',
      }
    };
  }
};
