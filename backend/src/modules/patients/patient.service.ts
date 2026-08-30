import { query } from '../../config/db';
import { Patient, UpdatePatientInput } from './patient.model';

export async function getPatientById(patientId: string): Promise<(Patient & { name: string; phone: string }) | null> {
  const result = await query(
    `SELECT p.*, u.name, u.phone
     FROM patients p
     JOIN users u ON u.user_id = p.user_id
     WHERE p.patient_id = $1`,
    [patientId]
  );
  return (result.rows[0] as (Patient & { name: string; phone: string })) ?? null;
}

export async function getPatientByUserId(userId: string): Promise<Patient | null> {
  const result = await query<Patient>(
    'SELECT * FROM patients WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function updatePatient(patientId: string, input: UpdatePatientInput): Promise<Patient> {
  const result = await query<Patient>(
    `UPDATE patients SET
       abha_id = COALESCE($2, abha_id),
       aadhar_id = COALESCE($3, aadhar_id),
       blood_type = COALESCE($4, blood_type),
       allergies = COALESCE($5, allergies),
       chronic_conditions = COALESCE($6, chronic_conditions),
       current_medications = COALESCE($7, current_medications),
       emergency_contact_name = COALESCE($8, emergency_contact_name),
       emergency_contact_phone = COALESCE($9, emergency_contact_phone),
       is_pregnant = COALESCE($10, is_pregnant),
       is_diabetic = COALESCE($11, is_diabetic),
       is_hypertensive = COALESCE($12, is_hypertensive),
       assigned_subcentre_id = COALESCE($13, assigned_subcentre_id),
       updated_at = NOW()
     WHERE patient_id = $1
     RETURNING *`,
    [
      patientId,
      input.abhaId,
      input.aadharId,
      input.bloodType,
      input.allergies ? JSON.stringify(input.allergies) : null,
      input.chronicConditions ? JSON.stringify(input.chronicConditions) : null,
      input.currentMedications ? JSON.stringify(input.currentMedications) : null,
      input.emergencyContactName,
      input.emergencyContactPhone,
      input.isPregnant,
      input.isDiabetic,
      input.isHypertensive,
      input.assignedSubcentreId,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Patient not found');
  }
  return result.rows[0];
}

export async function searchPatients(search: string, limit = 20): Promise<(Patient & { name: string; phone: string })[]> {
  const result = await query(
    `SELECT p.*, u.name, u.phone
     FROM patients p
     JOIN users u ON u.user_id = p.user_id
     WHERE u.name ILIKE $1 OR u.phone ILIKE $1 OR p.abha_id ILIKE $1
     LIMIT $2`,
    [`%${search}%`, limit]
  );
  return result.rows as (Patient & { name: string; phone: string })[];
}
