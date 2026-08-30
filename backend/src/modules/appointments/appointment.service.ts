import { query } from '../../config/db';
import { emitEvent } from '../../events/eventBus';
import {
  Appointment,
  BookAppointmentInput,
  QueueStatus,
  FacilityRecommendation,
} from './appointment.model';
import * as queueService from './queue.service';

const TRIAGE_PRIORITY_MAP = { RED: 1, AMBER: 2, GREEN: 3 };

export async function bookAppointment(input: BookAppointmentInput): Promise<{
  appointment: Appointment;
  recommendations?: FacilityRecommendation[];
}> {
  let facilityId = input.facilityId;
  let recommendations: FacilityRecommendation[] | undefined;

  const triagePriority =
    input.triagePriority ??
    TRIAGE_PRIORITY_MAP[input.triageCategory ?? 'GREEN'];

  if (!facilityId && input.patientLat !== undefined && input.patientLng !== undefined) {
    recommendations = await queueService.recommendFacility(
      input.patientLat,
      input.patientLng,
      input.triageCategory ?? 'GREEN',
      input.preferTeleconsult
    );
    if (recommendations.length === 0) {
      throw new Error('No facilities found within range');
    }
    facilityId = recommendations[0].facilityId;
  }

  if (!facilityId) {
    throw new Error('facilityId is required or provide patient location for smart selection');
  }

  const scheduledTime = input.scheduledTime ?? new Date().toISOString();
  const scheduledTimestamp = new Date(scheduledTime).getTime();

  const result = await query<Appointment>(
    `INSERT INTO appointments (patient_id, provider_id, facility_id, scheduled_time, triage_priority, status)
     VALUES ($1, $2, $3, $4, $5, 'scheduled')
     RETURNING *`,
    [input.patientId, input.providerId ?? null, facilityId, scheduledTime, triagePriority]
  );

  const appointment = result.rows[0];

  const queuePosition = await queueService.addToQueue(
    facilityId,
    appointment.appointment_id,
    triagePriority,
    scheduledTimestamp
  );

  const activeDoctors = await queueService.getActiveDoctorCount(facilityId);
  const estimatedWait = queueService.estimateWaitMinutes(queuePosition, activeDoctors);

  const updated = await query<Appointment>(
    `UPDATE appointments SET queue_position = $2, estimated_wait_time_minutes = $3
     WHERE appointment_id = $1 RETURNING *`,
    [appointment.appointment_id, queuePosition, estimatedWait]
  );

  const finalAppointment = updated.rows[0];

  emitEvent('appointment_updated', {
    appointmentId: finalAppointment.appointment_id,
    facilityId,
    queuePosition,
    estimatedWaitMinutes: estimatedWait,
    triagePriority,
  });

  return { appointment: finalAppointment, recommendations };
}

export async function getQueueStatus(appointmentId: string): Promise<QueueStatus> {
  const result = await query<Appointment & { facility_name: string }>(
    `SELECT a.*, f.name AS facility_name
     FROM appointments a
     JOIN health_facilities f ON f.facility_id = a.facility_id
     WHERE a.appointment_id = $1`,
    [appointmentId]
  );

  if (result.rows.length === 0) {
    throw new Error('Appointment not found');
  }

  const appt = result.rows[0];
  const livePosition = await queueService.getQueuePosition(appt.facility_id, appointmentId);
  const position = livePosition ?? appt.queue_position ?? 1;
  const activeDoctors = await queueService.getActiveDoctorCount(appt.facility_id);
  const estimatedWait = queueService.estimateWaitMinutes(position, activeDoctors);

  return {
    appointmentId,
    queuePosition: position,
    estimatedWaitMinutes: estimatedWait,
    patientsAhead: Math.max(0, position - 1),
    facilityId: appt.facility_id,
    facilityName: appt.facility_name,
    status: appt.status,
  };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string
): Promise<Appointment> {
  const result = await query<Appointment>(
    `UPDATE appointments SET status = $2 WHERE appointment_id = $1 RETURNING *`,
    [appointmentId, status]
  );

  if (result.rows.length === 0) {
    throw new Error('Appointment not found');
  }

  const appointment = result.rows[0];

  if (['completed', 'cancelled', 'no_show'].includes(status)) {
    await queueService.removeFromQueue(appointment.facility_id, appointmentId);
  }

  emitEvent('appointment_updated', {
    appointmentId,
    facilityId: appointment.facility_id,
    status,
  });

  return appointment;
}

export async function listFacilityQueue(facilityId: string): Promise<(Appointment & { patient_name: string })[]> {
  const result = await query<Appointment & { patient_name: string }>(
    `SELECT a.*, u.name AS patient_name
     FROM appointments a
     JOIN patients p ON p.patient_id = a.patient_id
     JOIN users u ON u.user_id = p.user_id
     WHERE a.facility_id = $1 AND a.status IN ('scheduled', 'in_progress')
     ORDER BY a.triage_priority ASC, a.scheduled_time ASC`,
    [facilityId]
  );
  return result.rows;
}
