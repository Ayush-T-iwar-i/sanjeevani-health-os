import { UserRole } from '../../gateway/authMiddleware';

export interface User {
  user_id: string;
  name: string;
  email: string | null;
  phone: string;
  dob: string | null;
  role: UserRole;
  facility_id: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface Patient {
  patient_id: string;
  user_id: string;
  abha_id: string | null;
  aadhar_id: string | null;
  blood_type: string | null;
  allergies: unknown[];
  chronic_conditions: unknown[];
  current_medications: unknown[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_pregnant: boolean;
  is_diabetic: boolean;
  is_hypertensive: boolean;
  assigned_subcentre_id: string | null;
  is_high_risk: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterInput {
  name: string;
  email?: string;
  phone: string;
  password: string;
  role?: UserRole;
  facilityId?: string;
  preferredLanguage?: string;
  dob?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface OtpVerifyInput {
  phone: string;
  otp: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
