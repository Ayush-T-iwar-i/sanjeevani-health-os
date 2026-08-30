import { Request, Response } from 'express';
import { z } from 'zod';
import * as consultationService from './consultation.service';
import { getRoomByConsultation } from './webrtc.signaling';

const initiateSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  type: z.enum(['remote', 'in-person', 'follow-up']).optional(),
  symptoms: z.string().optional(),
  audioOnly: z.boolean().optional(),
});

const prescribeSchema = z.object({
  medicines: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
      instructions: z.string().optional(),
    })
  ).min(1),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
  language: z.string().optional(),
});

export async function initiate(req: Request, res: Response): Promise<void> {
  try {
    const input = initiateSchema.parse(req.body);
    const result = await consultationService.initiateConsultation(input, req.user!.userId);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to initiate consultation';
    res.status(400).json({ error: message });
  }
}

export async function prescribe(req: Request, res: Response): Promise<void> {
  try {
    const input = prescribeSchema.parse(req.body);
    const consultation = await consultationService.prescribe(req.params.id, input);
    res.json(consultation);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to prescribe';
    res.status(400).json({ error: message });
  }
}

export async function getConsultation(req: Request, res: Response): Promise<void> {
  try {
    const consultation = await consultationService.getConsultation(req.params.id);
    if (!consultation) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }
    const room = await getRoomByConsultation(req.params.id);
    res.json({ consultation, room });
  } catch {
    res.status(500).json({ error: 'Failed to fetch consultation' });
  }
}

export async function endConsultation(req: Request, res: Response): Promise<void> {
  try {
    const consultation = await consultationService.endConsultation(req.params.id);
    res.json(consultation);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to end consultation';
    res.status(400).json({ error: message });
  }
}

export async function listByPatient(req: Request, res: Response): Promise<void> {
  try {
    const consultations = await consultationService.listPatientConsultations(req.params.patientId);
    res.json({ consultations });
  } catch {
    res.status(500).json({ error: 'Failed to list consultations' });
  }
}
