import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' },
});

export async function storeOtp(phone: string, otp: string, ttlSeconds: number): Promise<void> {
  await redis.setex(`otp:${phone}`, ttlSeconds, otp);
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const stored = await redis.get(`otp:${phone}`);
  if (!stored || stored !== otp) return false;
  await redis.del(`otp:${phone}`);
  return true;
}

export async function storeRefreshToken(userId: string, token: string, ttlSeconds: number): Promise<void> {
  await redis.setex(`refresh:${userId}:${token.slice(-16)}`, ttlSeconds, token);
}

export async function revokeRefreshToken(userId: string, tokenSuffix: string): Promise<void> {
  await redis.del(`refresh:${userId}:${tokenSuffix}`);
}
