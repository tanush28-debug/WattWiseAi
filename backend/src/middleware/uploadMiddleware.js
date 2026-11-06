import multer from 'multer';

// Use memoryStorage so the backend can inspect the buffer, upload to Supabase Storage,
// and pass to Google Gemini Vision OCR without writing temporary files to disk.
const storage = multer.memoryStorage();

// Allowed MIME types: PDF, PNG, JPG/JPEG/PJPEG
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
];

// Maximum upload threshold: 15 MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const ext = (file.originalname || '').toLowerCase();
  const isExtensionValid = /\.(pdf|png|jpe?g)$/i.test(ext);
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype) ||
    (file.mimetype === 'application/octet-stream' && isExtensionValid);

  if (isMimeValid || isExtensionValid) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only PDF, PNG, and JPG documents are permitted.`), false);
  }
};

const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
}).single('file');

/** Detect the real document type from magic bytes, ignoring the client MIME type. */
function detectDocumentType(buffer) {
  if (!buffer || buffer.length < 4) return null;
  if (buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) return 'application/pdf';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a) {
    return 'image/png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}

function extensionMatchesType(fileName, detectedType) {
  const ext = (fileName || '').toLowerCase();
  if (detectedType === 'application/pdf') return ext.endsWith('.pdf');
  if (detectedType === 'image/png') return ext.endsWith('.png');
  if (detectedType === 'image/jpeg') return ext.endsWith('.jpg') || ext.endsWith('.jpeg');
  return false;
}

/**
 * Wrapper that handles multer errors explicitly and passes them to Express error handler.
 * Uses field name 'file' (matches frontend FormData key).
 */
export const uploadBillMiddleware = (req, res, next) => {
  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (e.g. file too large)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum upload size is 15 MB.',
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: `Unexpected file field. Please use the correct upload form. Received field: "${err.field}"`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error.',
      });
    } else if (err) {
      // Custom fileFilter errors or other errors
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file. Only PDF, PNG, and JPG files are permitted.',
      });
    }

    if (req.file) {
      const detectedType = detectDocumentType(req.file.buffer);
      if (!detectedType) {
        return res.status(400).json({
          success: false,
          message: 'File content is not a valid PDF, PNG or JPEG document.',
        });
      }
      if (!extensionMatchesType(req.file.originalname, detectedType)) {
        return res.status(400).json({
          success: false,
          message: 'File content does not match its extension. Rename the file correctly or upload an unmodified document.',
        });
      }
      // Trust the verified content type, not the client-supplied MIME type.
      req.file.mimetype = detectedType;
    }

    next();
  });
};
