import { Router } from 'express';
import { authMiddleware, requireRoles } from '../../gateway/authMiddleware';
import * as patientController from './patient.controller';

const router = Router();

router.get('/search', authMiddleware, requireRoles('doctor', 'asha', 'anm', 'cho', 'facility_admin'), patientController.searchPatients);
router.get('/me', authMiddleware, patientController.getMyPatientProfile);
router.get('/abha/:abhaId/records', authMiddleware, requireRoles('doctor', 'asha', 'anm', 'cho', 'facility_admin'), patientController.getRecordsByAbha);
router.get('/:id', authMiddleware, patientController.getPatient);
router.get('/:id/records', authMiddleware, requireRoles('doctor', 'asha', 'anm', 'cho', 'facility_admin', 'patient'), patientController.getPatientRecords);
router.patch('/:id', authMiddleware, requireRoles('doctor', 'asha', 'anm', 'patient'), patientController.updatePatient);

export default router;
