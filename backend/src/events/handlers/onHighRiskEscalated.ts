import { onEvent } from '../eventBus';
import { logger } from '../../config/logger';
import { sendSMS } from '../../modules/notifications/notification.service';
import { query } from '../../config/db';

export function registerHighRiskHandler(): void {
  onEvent('high_risk_patient_alert', (payload: unknown) => {
    const data = payload as { patientId: string; reason: string };
    logger.warn(`High-risk patient alert: ${data.patientId} — ${data.reason}`);
    void notifyAssignedWorker(data.patientId, data.reason);
  });
}

async function notifyAssignedWorker(patientId: string, reason: string): Promise<void> {
  try {
    const { rows } = await query<{ phone: string }>(
      `SELECT u.phone FROM patients p
       JOIN users u ON u.user_id = p.assigned_asha_id
       WHERE p.patient_id = $1`,
      [patientId]
    );
    if (rows[0]?.phone) {
      await sendSMS(rows[0].phone, `High-risk patient flagged: ${reason}. Please follow up.`);
    }
  } catch {
    // assigned_asha_id may not exist on every deployment's patient schema — non-fatal
  }
}