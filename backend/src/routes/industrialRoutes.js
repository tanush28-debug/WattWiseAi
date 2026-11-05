import { Router } from 'express';
import { industrialController } from '../controllers/industrialController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/overview', optionalAuth, industrialController.getOverview);
router.get('/facilities', optionalAuth, industrialController.getFacilities);
router.post('/facilities', optionalAuth, industrialController.addFacility);
router.get('/machines', optionalAuth, industrialController.getMachines);
router.post('/machines', optionalAuth, industrialController.addMachine);
router.get('/anomalies', optionalAuth, industrialController.getAnomalies);
router.get('/optimization', optionalAuth, industrialController.getOptimization);
router.post('/reports/generate', optionalAuth, industrialController.generateReport);

export default router;

