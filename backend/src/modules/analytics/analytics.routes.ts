import { Router } from 'express';
import { getSummary } from './analytics.controller';
import { authMiddleware } from '../../gateway/authMiddleware';

const router = Router();

router.get('/summary', authMiddleware, getSummary);

export default router;