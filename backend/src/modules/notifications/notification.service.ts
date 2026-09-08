import { sendViaSmsProvider } from './sms.provider';
import { sendViaPushProvider } from './push.provider';
import { query } from '../../config/db';
import { logger } from '../../config/logger';

export async function sendSMS(phone: string, message: string): Promise<void> {
  try {
    await sendViaSmsProvider(phone, message);
  } catch (err) {
    logger.error('SMS send failed', { phone, err: (err as Error).message });
  }
}

export async function sendPushToUser(userId: string, title: string, body: string): Promise<void> {
  try {
    const { rows } = await query<{ push_token: string }>(
      `SELECT push_token FROM users WHERE user_id = $1 AND push_token IS NOT NULL`,
      [userId]
    );
    if (rows[0]?.push_token) {
      await sendViaPushProvider(rows[0].push_token, title, body);
    }
  } catch (err) {
    logger.error('Push notification failed', { userId, err: (err as Error).message });
  }
}

export async function notifyFacilityStaff(facilityId: string, message: string): Promise<void> {
  const { rows } = await query<{ phone: string }>(
    `SELECT phone FROM users WHERE facility_id = $1 AND role IN ('doctor', 'facility_admin', 'pharmacist')`,
    [facilityId]
  );
  await Promise.all(rows.map((r) => sendSMS(r.phone, message)));
}