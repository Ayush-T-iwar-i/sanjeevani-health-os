import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { query } from '../../config/db';
import { env } from '../../config/env';
import { verifyOtp, storeRefreshToken } from '../../gateway/rateLimiter';
import { UserRole } from '../../gateway/authMiddleware';
import { sendOtp } from './otp.service';
import { RegisterInput, LoginInput, TokenPair, User } from './auth.model';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const accessTokenOptions: SignOptions = { expiresIn: env.JWT_EXPIRY as SignOptions['expiresIn'] };
const refreshTokenOptions: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] };

function signAccessToken(userId: string, role: UserRole, facilityId?: string | null): string {
  return jwt.sign({ userId, role, facilityId: facilityId ?? undefined }, env.JWT_SECRET, accessTokenOptions);
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, refreshTokenOptions);
}

export async function register(input: RegisterInput): Promise<{ user: User; tokens: TokenPair }> {
  const existing = await query<User>('SELECT user_id FROM users WHERE phone = $1', [input.phone]);
  if (existing.rows.length > 0) {
    throw new Error('Phone number already registered');
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const role = input.role ?? 'patient';

  const result = await query<User>(
    `INSERT INTO users (name, email, phone, dob, role, facility_id, preferred_language, hashed_password)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING user_id, name, email, phone, dob, role, facility_id, preferred_language, created_at, updated_at, last_login`,
    [
      input.name,
      input.email ?? null,
      input.phone,
      input.dob ?? null,
      role,
      input.facilityId ?? null,
      input.preferredLanguage ?? 'en',
      hashedPassword,
    ]
  );

  const user = result.rows[0];

  if (role === 'patient') {
    await query(
      `INSERT INTO patients (user_id) VALUES ($1)`,
      [user.user_id]
    );
  }

  const accessToken = signAccessToken(user.user_id, user.role, user.facility_id);
  const refreshToken = signRefreshToken(user.user_id);
  await storeRefreshToken(user.user_id, refreshToken, REFRESH_TTL_SECONDS);

  return {
    user,
    tokens: { accessToken, refreshToken, expiresIn: env.JWT_EXPIRY },
  };
}

export async function login(input: LoginInput): Promise<{ requiresOtp: true; phone: string } | { requiresOtp: false; user: User; tokens: TokenPair }> {
  const result = await query<User & { hashed_password: string }>(
    `SELECT user_id, name, email, phone, dob, role, facility_id, preferred_language,
            created_at, updated_at, last_login, hashed_password
     FROM users WHERE phone = $1`,
    [input.phone]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(input.password, user.hashed_password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  await sendOtp(input.phone);
  return { requiresOtp: true, phone: input.phone };
}

export async function verifyLoginOtp(phone: string, otp: string): Promise<{ user: User; tokens: TokenPair }> {
  const valid = await verifyOtp(phone, otp);
  if (!valid) {
    throw new Error('Invalid or expired OTP');
  }

  const result = await query<User>(
    `UPDATE users SET last_login = NOW()
     WHERE phone = $1
     RETURNING user_id, name, email, phone, dob, role, facility_id, preferred_language, created_at, updated_at, last_login`,
    [phone]
  );

  const user = result.rows[0];
  const accessToken = signAccessToken(user.user_id, user.role, user.facility_id);
  const refreshToken = signRefreshToken(user.user_id);
  await storeRefreshToken(user.user_id, refreshToken, REFRESH_TTL_SECONDS);

  return {
    user,
    tokens: { accessToken, refreshToken, expiresIn: env.JWT_EXPIRY },
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const payload = jwt.verify(refreshToken, env.JWT_SECRET) as { userId: string; type?: string };
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  const result = await query<User>(
    `SELECT user_id, role, facility_id FROM users WHERE user_id = $1`,
    [payload.userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  const accessToken = signAccessToken(user.user_id, user.role, user.facility_id);
  const newRefreshToken = signRefreshToken(user.user_id);
  await storeRefreshToken(user.user_id, newRefreshToken, REFRESH_TTL_SECONDS);

  return { accessToken, refreshToken: newRefreshToken, expiresIn: env.JWT_EXPIRY };
}
