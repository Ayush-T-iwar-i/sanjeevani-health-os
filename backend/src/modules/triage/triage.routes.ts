import { Router } from 'express';
import { authMiddleware } from '../../gateway/authMiddleware';
import * as triageController from './triage.controller';

const router = Router();

router.get('/symptoms', triageController.getSymptoms);
router.post('/assess', authMiddleware, triageController.assess);

export default router;
