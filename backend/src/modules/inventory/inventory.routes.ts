import { Router } from 'express';
import * as controller from './inventory.controller';
import { authMiddleware } from '../../gateway/authMiddleware';

const router = Router();

// GET /api/inventory/medicines?facility_id=      (Problem 3, per master spec Section 5)
router.get('/medicines', authMiddleware, controller.getMedicines);
router.get('/facility/:facilityId', authMiddleware, controller.getInventory);
router.post('/upsert', authMiddleware, controller.postUpsert);
router.post('/:id/adjust', authMiddleware, controller.postAdjust);
// Diagnostics + tele-pathology (Problem 3, 7)
router.post('/diagnostics/request', authMiddleware, controller.postRequestDiagnostic);
router.post('/diagnostics/:encounterId/report', authMiddleware, controller.postAttachReport);

export default router;
