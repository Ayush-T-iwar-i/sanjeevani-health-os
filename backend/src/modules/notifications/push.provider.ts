import { logger } from '../../config/logger';

export async function sendViaPushProvider(pushToken: string, title: string, body: string): Promise<void> {
  if (!pushToken.startsWith('ExponentPushToken')) {
    logger.warn(`Push token does not look like an Expo token, skipping: ${pushToken}`);
    return;
  }

  const resp = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: pushToken, title, body, sound: 'default', priority: 'high' }),
  });

  if (!resp.ok) {
    throw new Error(`Expo push failed: ${resp.status} ${await resp.text()}`);
  }
}