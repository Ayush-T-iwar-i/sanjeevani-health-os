import { randomInt } from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { storeOtp } from '../../gateway/rateLimiter';

function generateOtp(): string {
  // crypto.randomInt is CSPRNG-backed; Math.random() is predictable and
  // unsafe for anything security-sensitive like login OTPs.
  return randomInt(100000, 1000000).toString();
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
