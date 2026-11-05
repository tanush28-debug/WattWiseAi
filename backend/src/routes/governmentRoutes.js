import { Router } from 'express';
import { governmentController } from '../controllers/governmentController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/overview', optionalAuth, governmentController.getOverview);
router.get('/regional', optionalAuth, governmentController.getRegionalAnalytics);
router.get('/sectors', optionalAuth, governmentController.getSectorAnalytics);
router.get('/tariffs', optionalAuth, governmentController.getTariffPolicies);
router.post('/tariffs', optionalAuth, governmentController.saveTariffPolicy);
router.post('/policy-simulator', optionalAuth, governmentController.simulatePolicy);
router.post('/reports', optionalAuth, governmentController.generateReport);

export default router;

