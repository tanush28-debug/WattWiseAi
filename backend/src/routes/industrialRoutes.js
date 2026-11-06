import { Router } from 'express';
import { industrialController } from '../controllers/industrialController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import {
  industrialFacilitySchema,
  industrialMachineSchema,
  industrialReportSchema,
} from '../validation/schemas.js';

const router = Router();

const industrialAccess = [authenticateUser, requireRole('INDUSTRIAL')];

router.get('/overview', ...industrialAccess, industrialController.getOverview);
router.get('/facilities', ...industrialAccess, industrialController.getFacilities);
router.post(
  '/facilities',
  ...industrialAccess,
  validateBody(industrialFacilitySchema),
  industrialController.addFacility
);
router.get('/machines', ...industrialAccess, industrialController.getMachines);
router.post(
  '/machines',
  ...industrialAccess,
  validateBody(industrialMachineSchema),
  industrialController.addMachine
);
router.get('/anomalies', ...industrialAccess, industrialController.getAnomalies);
router.get('/optimization', ...industrialAccess, industrialController.getOptimization);
router.post(
  '/reports/generate',
  ...industrialAccess,
  validateBody(industrialReportSchema),
  industrialController.generateReport
);

export default router;
