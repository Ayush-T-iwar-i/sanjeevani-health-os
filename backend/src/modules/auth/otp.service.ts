import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { storeOtp } from '../../gateway/rateLimiter';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<{ sent: boolean; otp?: string }> {
  const otp = generateOtp();
  await storeOtp(phone, otp, env.OTP_EXPIRY_SECONDS);

  if (env.SMS_PROVIDER === 'mock') {
    logger.info(`[MOCK SMS] OTP for ${phone}: ${otp}`);
    return { sent: true, otp: env.NODE_ENV === 'development' ? otp : undefined };
  }

  // Production: integrate Twilio or similar
  logger.info(`OTP sent to ${phone}`);
  return { sent: true };
}

export async function resendOtp(phone: string): Promise<{ sent: boolean; otp?: string }> {
  return sendOtp(phone);
}
