import { Request, Response } from 'express';
import * as sosService from './sos.service';
import { query } from '../../config/db';

async function resolvePatientId(req: Request): Promise<string | null> {
  if (req.body.patientId) return req.body.patientId;
  const { rows } = await query<{ patient_id: string }>(
    `SELECT patient_id FROM patients WHERE user_id = $1`,
    [req.user!.userId]
  );
  return rows[0]?.patient_id ?? null;
}

export async function postTrigger(req: Request, res: Response) {
  try {
    const { gpsLat, gpsLng } = req.body;

    if (gpsLat === undefined || gpsLng === undefined) {
      return res.status(400).json({ error: 'gpsLat and gpsLng are required' });
    }

    const patientId = await resolvePatientId(req);
    if (!patientId) {
      return res.status(400).json({ error: 'patientId could not be resolved for this user' });
    }

    const alert = await sosService.triggerSOS(patientId, gpsLat, gpsLng);
    return res.status(201).json(alert);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to trigger SOS', detail: (err as Error).message });
  }
}

export async function getStatus(req: Request, res: Response) {
  const alert = await sosService.getSOSStatus(req.params.id);
  if (!alert) return res.status(404).json({ error: 'SOS alert not found' });
  return res.status(200).json(alert);
}

export async function postResolve(req: Request, res: Response) {
  const alert = await sosService.resolveSOS(req.params.id);
  if (!alert) return res.status(404).json({ error: 'SOS alert not found' });
  return res.status(200).json(alert);
}