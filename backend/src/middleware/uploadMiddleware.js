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
    next();
  });
};
