import { Request, Response } from 'express';
import * as followupService from './followup.service';
import { enrollMaternalCare } from './carePathways/maternalCare.pathway';
import { enrollChildHealth } from './carePathways/childHealth.pathway';
import { enrollChronicDisease } from './carePathways/chronicDisease.pathway';

export async function getHighRisk(req: Request, res: Response) {
  const facilityId = req.query.facility_id as string;
  if (!facilityId) return res.status(400).json({ error: 'facility_id query param is required' });
  const patients = await followupService.listHighRiskPatients(facilityId);
  return res.status(200).json({ patients });
}

export async function postEnroll(req: Request, res: Response) {
  try {
    const { patientId, pathwayType } = req.body;
    if (!patientId || !pathwayType) {
      return res.status(400).json({ error: 'patientId and pathwayType are required' });
    }

    let result;
    switch (pathwayType) {
      case 'maternal':
        result = await enrollMaternalCare(patientId);
        break;
      case 'child':
        result = await enrollChildHealth(patientId);
        break;
      case 'chronic':
        result = await enrollChronicDisease(patientId, req.body.condition);
        break;
      default:
        return res.status(400).json({ error: 'pathwayType must be maternal | child | chronic' });
    }

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to enroll in care pathway', detail: (err as Error).message });
  }
}

export async function getForPatient(req: Request, res: Response) {
  const followups = await followupService.listFollowupsForPatient(req.params.patientId);
  return res.status(200).json({ followups });
}

export async function postComplete(req: Request, res: Response) {
  const followup = await followupService.markFollowupCompleted(req.params.id);
  if (!followup) return res.status(404).json({ error: 'Followup not found' });
  return res.status(200).json(followup);
}