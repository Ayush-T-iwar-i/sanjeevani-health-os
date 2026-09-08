import { query } from '../../config/db';
import { emitEvent } from '../../events/eventBus';

export type PathwayType = 'maternal' | 'child' | 'chronic';
export type FollowupStatus = 'pending' | 'completed' | 'missed';

export interface Followup {
  followup_id: string;
  patient_id: string;
  pathway_type: PathwayType;
  next_due_date: string;
  status: FollowupStatus;
  missed_count: number;
  created_at: string;
}

export async function scheduleFollowup(patientId: string, pathwayType: PathwayType, nextDueDate: string): Promise<Followup> {
  const { rows } = await query<Followup>(
    `INSERT INTO followups (followup_id, patient_id, pathway_type, next_due_date, status, missed_count, created_at)
     VALUES (uuid_generate_v4(), $1, $2, $3, 'pending', 0, NOW())
     RETURNING *`,
    [patientId, pathwayType, nextDueDate]
  );
  return rows[0];
}

export async function markFollowupCompleted(followupId: string): Promise<Followup | null> {
  const { rows } = await query<Followup>(
    `UPDATE followups SET status = 'completed' WHERE followup_id = $1 RETURNING *`,
    [followupId]
  );
  return rows[0] ?? null;
}

export async function listFollowupsForPatient(patientId: string): Promise<Followup[]> {
  const { rows } = await query<Followup>(
    `SELECT * FROM followups WHERE patient_id = $1 ORDER BY next_due_date ASC`,
    [patientId]
  );
  return rows;
}

/**
 * Run daily (via a scheduled job, same pattern as noShowWatcher.job.ts).
 * Any pending followup past due gets missed_count incremented; after 2 misses,
 * the patient is flagged is_high_risk and a high_risk_patient_alert fires (Problem 11).
 */
export async function sweepMissedFollowups(): Promise<void> {
  const { rows: missed } = await query<Followup>(
    `UPDATE followups
     SET status = 'missed', missed_count = missed_count + 1
     WHERE status = 'pending' AND next_due_date < CURRENT_DATE
     RETURNING *`
  );

  for (const followup of missed) {
    if (followup.missed_count >= 2) {
      await query(`UPDATE patients SET is_high_risk = TRUE WHERE patient_id = $1`, [followup.patient_id]);
      emitEvent('high_risk_patient_alert', {
        patientId: followup.patient_id,
        reason: `${followup.missed_count} missed ${followup.pathway_type} follow-ups`,
        followupId: followup.followup_id,
      });
    }
  }
}
