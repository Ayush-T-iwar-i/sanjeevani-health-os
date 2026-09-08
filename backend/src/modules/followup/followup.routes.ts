import { Router } from 'express';
import * as controller from './followup.controller';
import { authMiddleware } from '../../gateway/authMiddleware';

const router = Router();

// POST /api/followups/enroll   { patientId, pathwayType: 'maternal'|'child'|'chronic', condition? }
router.post('/enroll', authMiddleware, controller.postEnroll);
router.get('/high-risk', authMiddleware, controller.getHighRisk);
router.get('/patient/:patientId', authMiddleware, controller.getForPatient);
router.post('/:id/complete', authMiddleware, controller.postComplete);

export default router;