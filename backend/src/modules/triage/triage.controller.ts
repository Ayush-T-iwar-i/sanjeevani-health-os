import { Request, Response } from 'express';
import { z } from 'zod';
import * as triageService from './triage.service';

const assessSchema = z.object({
  patientId: z.string().uuid(),
  symptoms: z.array(z.string()).min(1),
  vitals: z.record(z.number()).optional(),
  facilityId: z.string().uuid().optional(),
  isPregnant: z.boolean().optional(),
  language: z.string().optional(),
});

export async function assess(req: Request, res: Response): Promise<void> {
  try {
    const input = assessSchema.parse(req.body);
    const result = await triageService.assessTriage({
      ...input,
      providerId: req.user?.role !== 'patient' ? req.user?.userId : undefined,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Triage assessment failed';
    res.status(400).json({ error: message });
  }
}

export async function getSymptoms(req: Request, res: Response): Promise<void> {
  const language = (req.query.lang as string) ?? 'en';
  res.json({ symptoms: triageService.getSymptomCatalog(language) });
}
