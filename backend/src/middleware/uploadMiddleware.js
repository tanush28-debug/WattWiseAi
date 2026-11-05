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

export const uploadBillMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
}).single('file');

