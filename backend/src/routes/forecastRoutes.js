import { Router } from 'express';
import { forecastController } from '../controllers/forecastController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/demand', optionalAuth, forecastController.getForecast);

export default router;

