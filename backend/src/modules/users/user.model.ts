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

export interface UpdateUserInput {
  name?: string;
  email?: string;
  preferredLanguage?: string;
  dob?: string;
}
