import { Router } from 'express';
import * as controller from './referral.controller';
import { authMiddleware } from '../../gateway/authMiddleware';

const router = Router();

// POST /api/referrals/create                (Problem 5)
router.post('/create', authMiddleware, controller.postCreate);
router.get('/:id/status', authMiddleware, controller.getStatus);
router.patch('/:id/status', authMiddleware, controller.patchStatus);
router.get('/patient/:patientId', authMiddleware, controller.getForPatient);
router.get('/facility/:facilityId', authMiddleware, controller.getForFacility);

export default router;
