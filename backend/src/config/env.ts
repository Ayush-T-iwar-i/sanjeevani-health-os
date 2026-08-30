import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  SMS_PROVIDER: z.enum(['mock', 'twilio']).default('mock'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
