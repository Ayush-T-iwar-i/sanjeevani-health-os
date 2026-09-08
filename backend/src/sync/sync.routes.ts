import { Router, Request, Response } from 'express';
import { authMiddleware } from '../gateway/authMiddleware';
import { pushMutations, pullChanges } from './syncController';

const router = Router();

// POST /api/sync/push   { deviceId, mutations: Mutation[] }
router.post('/push', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { deviceId, mutations } = req.body;
    if (!deviceId || !Array.isArray(mutations)) {
      return res.status(400).json({ error: 'deviceId and mutations[] are required' });
    }
    const results = await pushMutations(deviceId, req.user!.userId, mutations);
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: 'Sync push failed', detail: (err as Error).message });
  }
});

// GET /api/sync/pull?deviceId=
router.get('/pull', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deviceId = req.query.deviceId as string;
    if (!deviceId) return res.status(400).json({ error: 'deviceId query param is required' });
    const result = await pullChanges(deviceId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Sync pull failed', detail: (err as Error).message });
  }
});

export default router;
