import { query } from '../../config/db';
import { emitEvent } from '../../events/eventBus';
import {
  Consultation,
  InitiateConsultationInput,
  PrescriptionInput,
} from './consultation.model';
import { createSignalingRoom, generateLiveKitToken } from './webrtc.signaling';
import { buildPrescriptionPayload } from './prescription.service';
import * as appointmentService from '../appointments/appointment.service';

export async function initiateConsultation(
  input: InitiateConsultationInput,
  requestingUserId: string
): Promise<{
  consultation: Consultation;
  room: { roomId: string; audioOnly: boolean; liveKitToken: string | null };
}> {
  let providerId = input.providerId;

  if (!providerId) {
    const doctorResult = await query<{ user_id: string }>(
      `SELECT user_id FROM users WHERE role = 'doctor' ORDER BY last_login DESC NULLS LAST LIMIT 1`
    );
    providerId = doctorResult.rows[0]?.user_id;
    if (!providerId) {
      throw new Error('No available provider found');
    }
  }

  const result = await query<Consultation>(
    `INSERT INTO consultations (patient_id, provider_id, type, symptoms, status, start_time)
     VALUES ($1, $2, $3, $4, 'waiting', NOW())
     RETURNING *`,
    [input.patientId, providerId, input.type ?? 'remote', input.symptoms ?? null]
  );

  const consultation = result.rows[0];

  if (input.appointmentId) {
    await appointmentService.updateAppointmentStatus(input.appointmentId, 'in_progress');
  }

  const room = await createSignalingRoom(
    consultation.consultation_id,
    input.patientId,
    providerId,
    input.audioOnly ?? false
  );

  emitEvent('consultation_call_incoming', {
    consultationId: consultation.consultation_id,
    patientId: input.patientId,
    providerId,
    roomId: room.roomId,
    audioOnly: room.audioOnly,
  });

  return {
    consultation,
    room: {
      roomId: room.roomId,
      audioOnly: room.audioOnly,
      liveKitToken: generateLiveKitToken(room.roomId, requestingUserId),
    },
  };
}

export async function prescribe(
  consultationId: string,
  input: PrescriptionInput
): Promise<Consultation> {
  const prescription = buildPrescriptionPayload(input);

  const result = await query<Consultation>(
    `UPDATE consultations SET
       prescription = $2,
       diagnosis = COALESCE($3, diagnosis),
       treatment_plan = COALESCE($4, treatment_plan),
       notes = COALESCE($5, notes),
       status = 'completed',
       end_time = NOW()
     WHERE consultation_id = $1
     RETURNING *`,
    [
      consultationId,
      JSON.stringify(prescription),
      input.diagnosis,
      input.treatmentPlan,
      input.notes,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Consultation not found');
  }

  return result.rows[0];
}

export async function getConsultation(consultationId: string): Promise<Consultation | null> {
  const result = await query<Consultation>(
    'SELECT * FROM consultations WHERE consultation_id = $1',
    [consultationId]
  );
  return result.rows[0] ?? null;
}

export async function listPatientConsultations(patientId: string): Promise<Consultation[]> {
  const result = await query<Consultation>(
    'SELECT * FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC',
    [patientId]
  );
  return result.rows;
}

export async function endConsultation(consultationId: string): Promise<Consultation> {
  const result = await query<Consultation>(
    `UPDATE consultations SET status = 'completed', end_time = NOW()
     WHERE consultation_id = $1 RETURNING *`,
    [consultationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Consultation not found');
  }
  return result.rows[0];
}
