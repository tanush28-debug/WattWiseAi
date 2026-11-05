import { Router } from 'express';
import { billController } from '../controllers/billController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { uploadBillMiddleware } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', optionalAuth, billController.getBills);
router.post('/upload', optionalAuth, uploadBillMiddleware, billController.uploadBill);
router.patch('/:id/confirm', optionalAuth, billController.confirmBill);
router.delete('/:id', optionalAuth, billController.deleteBill);

export default router;
