import { Router } from 'express';
import { governmentController } from '../controllers/governmentController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import {
  governmentReportSchema,
  governmentSimulationSchema,
  governmentTariffSchema,
} from '../validation/schemas.js';

const router = Router();

const governmentAccess = [authenticateUser, requireRole('GOVERNMENT_ADMIN')];

router.get('/overview', ...governmentAccess, governmentController.getOverview);
router.get('/regional', ...governmentAccess, governmentController.getRegionalAnalytics);
router.get('/sectors', ...governmentAccess, governmentController.getSectorAnalytics);
router.get('/tariffs', ...governmentAccess, governmentController.getTariffPolicies);
router.post(
  '/tariffs',
  ...governmentAccess,
  validateBody(governmentTariffSchema),
  governmentController.saveTariffPolicy
);
router.post(
  '/policy-simulator',
  ...governmentAccess,
  validateBody(governmentSimulationSchema),
  governmentController.simulatePolicy
);
router.post(
  '/reports',
  ...governmentAccess,
  validateBody(governmentReportSchema),
  governmentController.generateReport
);

export default router;
