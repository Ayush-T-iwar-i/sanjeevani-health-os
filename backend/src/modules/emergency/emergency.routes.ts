import { Router } from 'express';
import * as controller from './sos.controller';
import { authMiddleware } from '../../gateway/authMiddleware';

const router = Router();

router.post('/sos', authMiddleware, controller.postTrigger);
router.get('/sos/:id', authMiddleware, controller.getStatus);
router.post('/sos/:id/resolve', authMiddleware, controller.postResolve);

export default router;