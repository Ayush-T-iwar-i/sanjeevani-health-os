import { query } from '../../config/db';
import { EHRTimeline } from './patient.model';

export async function getFullEHR(patientId: string, requestingUserId: string, ipAddress?: string): Promise<EHRTimeline> {
  const patientResult = await query(
    `SELECT p.*, u.name, u.phone
     FROM patients p
     JOIN users u ON u.user_id = p.user_id
     WHERE p.patient_id = $1`,
    [patientId]
  );

  if (patientResult.rows.length === 0) {
    throw new Error('Patient not found');
  }

  const [encounters, consultations, appointments, referrals, followups] = await Promise.all([
    query('SELECT * FROM encounters WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]),
    query('SELECT * FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]),
    query('SELECT * FROM appointments WHERE patient_id = $1 ORDER BY scheduled_time DESC', [patientId]),
    query('SELECT * FROM referrals WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]),
    query('SELECT * FROM followups WHERE patient_id = $1 ORDER BY next_due_date ASC', [patientId]),
  ]);

  await query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [requestingUserId, 'EHR_ACCESS', 'patient', patientId, ipAddress ?? null]
  );

  return {
    patient: patientResult.rows[0] as EHRTimeline['patient'],
    encounters: encounters.rows,
    consultations: consultations.rows,
    appointments: appointments.rows,
    referrals: referrals.rows,
    followups: followups.rows,
  };
}

export async function getEHRByAbhaId(abhaId: string, requestingUserId: string, ipAddress?: string): Promise<EHRTimeline> {
  const result = await query<{ patient_id: string }>(
    'SELECT patient_id FROM patients WHERE abha_id = $1',
    [abhaId]
  );

  if (result.rows.length === 0) {
    throw new Error('Patient not found for ABHA ID');
  }

  return getFullEHR(result.rows[0].patient_id, requestingUserId, ipAddress);
}
