import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';
import { resendOtp } from './otp.service';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  password: z.string().min(8),
  role: z.enum(['patient', 'asha', 'anm', 'cho', 'doctor', 'facility_admin']).optional(),
  facilityId: z.string().uuid().optional(),
  preferredLanguage: z.string().default('en'),
  dob: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(1),
});

const otpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ error: message });
  }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const input = otpSchema.parse(req.body);
    const result = await authService.verifyLoginOtp(input.phone, input.otp);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OTP verification failed';
    res.status(401).json({ error: message });
  }
}

export async function resendOtpHandler(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
    const result = await resendOtp(phone);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: 'Failed to resend OTP' });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
