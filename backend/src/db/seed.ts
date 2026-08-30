import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { logger } from '../config/logger';

async function seed() {
  const facilityResult = await pool.query(
    `INSERT INTO health_facilities (name, type, location, services_offered, contact_info)
     VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6)
     ON CONFLICT DO NOTHING
     RETURNING facility_id`,
    [
      'Demo PHC Rampur',
      'phc',
      77.5946,
      12.9716,
      JSON.stringify(['consultation', 'lab', 'pharmacy', 'xray']),
      JSON.stringify({ phone: '+919876543210', email: 'phc.rampur@health.in' }),
    ]
  );

  let facilityId = facilityResult.rows[0]?.facility_id;
  if (!facilityId) {
    const existing = await pool.query(
      `SELECT facility_id FROM health_facilities WHERE name = $1 LIMIT 1`,
      ['Demo PHC Rampur']
    );
    facilityId = existing.rows[0]?.facility_id;
  }

  const passwordHash = await bcrypt.hash('demo1234', 12);

  const doctorResult = await pool.query(
    `INSERT INTO users (name, email, phone, role, facility_id, preferred_language, hashed_password)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (phone) DO NOTHING
     RETURNING user_id`,
    ['Dr. Priya Sharma', 'priya@health.in', '+919000000001', 'doctor', facilityId, 'hi', passwordHash]
  );

  const patientUserResult = await pool.query(
    `INSERT INTO users (name, email, phone, role, preferred_language, hashed_password)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (phone) DO NOTHING
     RETURNING user_id`,
    ['Ram Kumar', 'ram@example.com', '+919000000002', 'patient', 'hi', passwordHash]
  );

  const patientUserId = patientUserResult.rows[0]?.user_id;
  if (patientUserId) {
    await pool.query(
      `INSERT INTO patients (user_id, abha_id, blood_type, assigned_subcentre_id, chronic_conditions)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO NOTHING`,
      [
        patientUserId,
        'ABHA-DEMO-001',
        'B+',
        facilityId,
        JSON.stringify([{ condition: 'diabetes', since: '2020' }]),
      ]
    );
  }

  logger.info('Seed complete', {
    facilityId,
    doctorId: doctorResult.rows[0]?.user_id,
    patientUserId,
  });

  await pool.end();
}

seed().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
