import { query } from '../../config/db';
import { User, UpdateUserInput } from './user.model';

export async function getUserById(userId: string): Promise<User | null> {
  const result = await query<User>(
    `SELECT user_id, name, email, phone, dob, role, facility_id, preferred_language,
            created_at, updated_at, last_login
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
  const result = await query<User>(
    `UPDATE users SET
       name = COALESCE($2, name),
       email = COALESCE($3, email),
       preferred_language = COALESCE($4, preferred_language),
       dob = COALESCE($5, dob),
       updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, name, email, phone, dob, role, facility_id, preferred_language,
               created_at, updated_at, last_login`,
    [userId, input.name, input.email, input.preferredLanguage, input.dob]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  return result.rows[0];
}

export async function listUsersByFacility(facilityId: string, role?: string): Promise<User[]> {
  let sql = `SELECT user_id, name, email, phone, dob, role, facility_id, preferred_language,
                    created_at, updated_at, last_login
             FROM users WHERE facility_id = $1`;
  const params: unknown[] = [facilityId];

  if (role) {
    sql += ' AND role = $2';
    params.push(role);
  }

  const result = await query<User>(sql, params);
  return result.rows;
}
