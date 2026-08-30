import { Request, Response } from 'express';
import { z } from 'zod';
import * as appointmentService from './appointment.service';
import * as queueService from './queue.service';

const bookSchema = z.object({
  patientId: z.string().uuid(),
  facilityId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  scheduledTime: z.string().datetime().optional(),
  triagePriority: z.number().min(1).max(3).optional(),
  triageCategory: z.enum(['RED', 'AMBER', 'GREEN']).optional(),
  patientLat: z.number().optional(),
  patientLng: z.number().optional(),
  preferTeleconsult: z.boolean().optional(),
});

export async function book(req: Request, res: Response): Promise<void> {
  try {
    const input = bookSchema.parse(req.body);
    const result = await appointmentService.bookAppointment(input);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Booking failed';
    res.status(400).json({ error: message });
  }
}

export async function queueStatus(req: Request, res: Response): Promise<void> {
  try {
    const status = await appointmentService.getQueueStatus(req.params.id);
    res.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Not found';
    res.status(404).json({ error: message });
  }
}

export async function recommendFacilities(req: Request, res: Response): Promise<void> {
  try {
    const { lat, lng, category, teleconsult } = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      category: z.enum(['RED', 'AMBER', 'GREEN']).default('GREEN'),
      teleconsult: z.coerce.boolean().optional(),
    }).parse(req.query);

    const recommendations = await queueService.recommendFacility(
      lat,
      lng,
      category,
      teleconsult
    );
    res.json({ recommendations });
  } catch (err) {
    res.status(400).json({ error: 'Invalid query parameters' });
  }
}

export async function facilityQueue(req: Request, res: Response): Promise<void> {
  try {
    const queue = await appointmentService.listFacilityQueue(req.params.facilityId);
    res.json({ queue });
  } catch {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const appointment = await appointmentService.updateAppointmentStatus(req.params.id, status);
    res.json(appointment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    res.status(400).json({ error: message });
  }
}
