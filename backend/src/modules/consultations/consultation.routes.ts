import { Router } from 'express';
import { authMiddleware, requireRoles } from '../../gateway/authMiddleware';
import * as consultationController from './consultation.controller';

const router = Router();

router.post('/initiate', authMiddleware, consultationController.initiate);
router.post('/:id/prescribe', authMiddleware, requireRoles('doctor', 'cho'), consultationController.prescribe);
router.post('/:id/end', authMiddleware, requireRoles('doctor', 'cho', 'patient'), consultationController.endConsultation);
router.get('/patient/:patientId', authMiddleware, consultationController.listByPatient);
router.get('/:id', authMiddleware, consultationController.getConsultation);

export default router;
