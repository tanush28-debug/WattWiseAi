import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/chat', optionalAuth, aiController.askAdvisor);

export default router;

