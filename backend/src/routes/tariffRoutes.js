import { Router } from 'express';
import { tariffController } from '../controllers/tariffController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/categories', optionalAuth, tariffController.getCategories);
router.post('/simulate', optionalAuth, tariffController.simulate);

export default router;

