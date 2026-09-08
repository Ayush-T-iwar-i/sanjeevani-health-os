import { query } from '../../config/db';
import { emitEvent } from '../../events/eventBus';
import { CreateReferralInput, Referral, ReferralStatus } from './referral.model';

const DEFAULT_DUE_HOURS = 48;

export async function createReferral(input: CreateReferralInput): Promise<Referral> {
  const {
    patientId,
    sourceFacilityId,
    targetFacilityId,
    referringDoctorId,
    reason,
    recommendedSpecialty,
    priority = 'ROUTINE',
    dueInHours = DEFAULT_DUE_HOURS,
  } = input;

  const { rows } = await query<Referral>(
    `INSERT INTO referrals
       (referral_id, patient_id, source_facility_id, target_facility_id, referring_doctor_id,
        reason, recommended_specialty, priority, status, due_date, created_at)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, 'INITIATED', NOW() + ($8 || ' hours')::interval, NOW())
     RETURNING *`,
    [patientId, sourceFacilityId ?? null, targetFacilityId, referringDoctorId, reason, recommendedSpecialty ?? null, priority, dueInHours]
  );

  const referral = rows[0];

  emitEvent('referral_status_changed', {
    referralId: referral.referral_id,
    facilityId: targetFacilityId,
    status: referral.status,
    priority: referral.priority,
  });

  return referral;
}

export async function getReferralStatus(referralId: string): Promise<Referral | null> {
  const { rows } = await query<Referral>(`SELECT * FROM referrals WHERE referral_id = $1`, [referralId]);
  return rows[0] ?? null;
}

export async function listReferralsForPatient(patientId: string): Promise<Referral[]> {
  const { rows } = await query<Referral>(
    `SELECT * FROM referrals WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId]
  );
  return rows;
}

export async function listReferralsForFacility(facilityId: string, status?: ReferralStatus): Promise<Referral[]> {
  const params: any[] = [facilityId];
  let statusClause = '';
  if (status) {
    params.push(status);
    statusClause = `AND status = $${params.length}`;
  }
  const { rows } = await query<Referral>(
    `SELECT * FROM referrals WHERE target_facility_id = $1 ${statusClause} ORDER BY due_date ASC`,
    params
  );
  return rows;
}

export async function updateReferralStatus(referralId: string, status: ReferralStatus): Promise<Referral | null> {
  const timestampCol =
    status === 'ACCEPTED' ? 'accepted_at' : status === 'COMPLETED' ? 'completed_at' : null;

  const { rows } = await query<Referral>(
    `UPDATE referrals
     SET status = $1 ${timestampCol ? `, ${timestampCol} = NOW()` : ''}
     WHERE referral_id = $2
     RETURNING *`,
    [status, referralId]
  );

  const referral = rows[0];
  if (referral) {
    emitEvent('referral_status_changed', {
      referralId: referral.referral_id,
      facilityId: referral.target_facility_id,
      status: referral.status,
    });
  }
  return referral ?? null;
}

/**
 * Called by noShowWatcher.job.ts on a schedule. Marks any referral past its
 * due_date and still INITIATED/ACCEPTED as NO_SHOW, then fires an alert.
 */
export async function flagOverdueReferrals(): Promise<Referral[]> {
  const { rows } = await query<Referral>(
    `UPDATE referrals
     SET status = 'NO_SHOW'
     WHERE status IN ('INITIATED', 'ACCEPTED') AND due_date < NOW()
     RETURNING *`
  );

  for (const referral of rows) {
    emitEvent('referral_status_changed', {
      referralId: referral.referral_id,
      facilityId: referral.target_facility_id,
      status: 'NO_SHOW',
      alert: true,
    });
  }

  return rows;
}
