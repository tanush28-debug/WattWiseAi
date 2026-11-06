import { Router } from 'express';
import { billController } from '../controllers/billController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { uploadBillMiddleware } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', authenticateUser, billController.getBills);
router.post('/upload', authenticateUser, uploadBillMiddleware, billController.uploadBill);
router.patch('/:id/confirm', authenticateUser, billController.confirmBill);
router.delete('/:id', authenticateUser, billController.deleteBill);

export default router;
