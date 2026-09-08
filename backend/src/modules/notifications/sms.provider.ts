import { env } from '../../config/env';
import { logger } from '../../config/logger';

export async function sendViaSmsProvider(phone: string, message: string): Promise<void> {
  const provider = env.SMS_PROVIDER || 'mock';

  if (provider === 'mock') {
    logger.info(`[MOCK SMS] To: ${phone} | ${message}`);
    return;
  }

  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: fromNumber ?? '', Body: message }),
    });

    if (!resp.ok) {
      throw new Error(`Twilio SMS failed: ${resp.status} ${await resp.text()}`);
    }
    return;
  }

  throw new Error(`Unknown SMS_PROVIDER: ${provider}`);
}