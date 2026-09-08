import { Request, Response } from 'express';
import { getFacilitySummary } from './analytics.service';

export async function getSummary(req: Request, res: Response) {
  try {
    const facilityId = req.query.facility_id as string;
    if (!facilityId) return res.status(400).json({ error: 'facility_id query param is required' });
    const summary = await getFacilitySummary(facilityId);
    return res.status(200).json(summary);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch analytics', detail: (err as Error).message });
  }
}