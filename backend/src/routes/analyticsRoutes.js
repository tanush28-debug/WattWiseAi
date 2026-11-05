import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/consumer/overview', optionalAuth, analyticsController.getConsumerOverview);
router.get('/consumption', optionalAuth, analyticsController.getConsumptionHistory);
router.get('/carbon', optionalAuth, analyticsController.getCarbonMetrics);
router.get('/grid-monitor', analyticsController.getGridMonitor);

export default router;

