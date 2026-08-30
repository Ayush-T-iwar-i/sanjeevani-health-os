import { Request, Response } from 'express';
import { z } from 'zod';
import * as patientService from './patient.service';
import * as ehrService from './ehr.service';

export async function getPatient(req: Request, res: Response): Promise<void> {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json(patient);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
}

export async function getMyPatientProfile(req: Request, res: Response): Promise<void> {
  try {
    const patient = await patientService.getPatientByUserId(req.user!.userId);
    if (!patient) {
      res.status(404).json({ error: 'Patient profile not found' });
      return;
    }
    res.json(patient);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
}

export async function updatePatient(req: Request, res: Response): Promise<void> {
  try {
    const input = z.object({
      abhaId: z.string().optional(),
      aadharId: z.string().optional(),
      bloodType: z.string().optional(),
      allergies: z.array(z.unknown()).optional(),
      chronicConditions: z.array(z.unknown()).optional(),
      currentMedications: z.array(z.unknown()).optional(),
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z.string().optional(),
      isPregnant: z.boolean().optional(),
      isDiabetic: z.boolean().optional(),
      isHypertensive: z.boolean().optional(),
      assignedSubcentreId: z.string().uuid().optional(),
    }).parse(req.body);

    const patient = await patientService.updatePatient(req.params.id, input);
    res.json(patient);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    res.status(400).json({ error: message });
  }
}

export async function getPatientRecords(req: Request, res: Response): Promise<void> {
  try {
    const ip = req.ip;
    const ehr = await ehrService.getFullEHR(req.params.id, req.user!.userId, ip);
    res.json(ehr);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch records';
    res.status(404).json({ error: message });
  }
}

export async function getRecordsByAbha(req: Request, res: Response): Promise<void> {
  try {
    const { abhaId } = req.params;
    const ehr = await ehrService.getEHRByAbhaId(abhaId, req.user!.userId, req.ip);
    res.json(ehr);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch records';
    res.status(404).json({ error: message });
  }
}

export async function searchPatients(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string) ?? '';
    if (q.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }
    const patients = await patientService.searchPatients(q);
    res.json({ patients });
  } catch {
    res.status(500).json({ error: 'Search failed' });
  }
}
