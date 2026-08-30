import { Router } from 'express';
import { authMiddleware, requireRoles } from '../../gateway/authMiddleware';
import * as userController from './user.controller';

const router = Router();

router.get('/me', authMiddleware, userController.getProfile);
router.patch('/me', authMiddleware, userController.updateProfile);
router.get(
  '/facility/:facilityId',
  authMiddleware,
  requireRoles('facility_admin', 'cho', 'super_admin'),
  userController.listFacilityStaff
);

export default router;
