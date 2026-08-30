import { Router } from 'express';
import { authMiddleware, requireRoles } from '../../gateway/authMiddleware';
import * as appointmentController from './appointment.controller';

const router = Router();

router.post('/book', authMiddleware, appointmentController.book);
router.get('/recommend', authMiddleware, appointmentController.recommendFacilities);
router.get('/:id/queue-status', authMiddleware, appointmentController.queueStatus);
router.patch('/:id/status', authMiddleware, requireRoles('doctor', 'cho', 'facility_admin'), appointmentController.updateStatus);
router.get('/facility/:facilityId/queue', authMiddleware, requireRoles('doctor', 'cho', 'facility_admin', 'asha', 'anm'), appointmentController.facilityQueue);

export default router;
