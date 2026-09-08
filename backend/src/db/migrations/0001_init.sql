-- Sanjeevani Health OS — initial schema (Problem 4 groundwork)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM (
  'patient', 'asha', 'anm', 'cho', 'doctor', 'facility_admin', 'super_admin'
);

CREATE TABLE health_facilities (
  facility_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('subcentre', 'phc', 'chc', 'district_hospital')),
  location GEOGRAPHY(POINT, 4326),
  services_offered JSONB DEFAULT '[]'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_facilities_location ON health_facilities USING GIST (location);

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  dob DATE,
  role user_role NOT NULL DEFAULT 'patient',
  facility_id UUID REFERENCES health_facilities(facility_id),
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  hashed_password VARCHAR(255) NOT NULL,
  twofa_secret VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_facility_id ON users(facility_id);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE patients (
  patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  abha_id VARCHAR(50) UNIQUE,
  aadhar_id VARCHAR(20),
  blood_type VARCHAR(10),
  allergies JSONB DEFAULT '[]'::jsonb,
  chronic_conditions JSONB DEFAULT '[]'::jsonb,
  current_medications JSONB DEFAULT '[]'::jsonb,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  is_pregnant BOOLEAN DEFAULT FALSE,
  is_diabetic BOOLEAN DEFAULT FALSE,
  is_hypertensive BOOLEAN DEFAULT FALSE,
  assigned_subcentre_id UUID REFERENCES health_facilities(facility_id),
  is_high_risk BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_abha_id ON patients(abha_id);
CREATE INDEX idx_patients_assigned_subcentre ON patients(assigned_subcentre_id);
CREATE INDEX idx_patients_high_risk ON patients(is_high_risk) WHERE is_high_risk = TRUE;

CREATE TYPE triage_category AS ENUM ('RED', 'AMBER', 'GREEN');

CREATE TABLE encounters (
  encounter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id),
  provider_id UUID REFERENCES users(user_id),
  facility_id UUID REFERENCES health_facilities(facility_id),
  triage_category triage_category,
  chief_complaints JSONB DEFAULT '[]'::jsonb,
  vitals_payload JSONB DEFAULT '{}'::jsonb,
  synced_from_offline BOOLEAN DEFAULT FALSE,
  offline_created_at TIMESTAMPTZ,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_facility_id ON encounters(facility_id);

CREATE TABLE consultations (
  consultation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id),
  provider_id UUID REFERENCES users(user_id),
  type VARCHAR(50) DEFAULT 'remote',
  symptoms TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescription JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'scheduled',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  video_recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_status ON consultations(status);

CREATE TABLE appointments (
  appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id),
  provider_id UUID REFERENCES users(user_id),
  facility_id UUID REFERENCES health_facilities(facility_id),
  scheduled_time TIMESTAMPTZ NOT NULL,
  queue_position INTEGER,
  estimated_wait_time_minutes INTEGER,
  triage_priority INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_facility_id ON appointments(facility_id);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TYPE referral_priority AS ENUM ('EMERGENCY', 'URGENT', 'ROUTINE');
CREATE TYPE referral_status AS ENUM ('INITIATED', 'ACCEPTED', 'COMPLETED', 'EXPIRED', 'NO_SHOW');

CREATE TABLE referrals (
  referral_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id),
  source_facility_id UUID REFERENCES health_facilities(facility_id),
  target_facility_id UUID REFERENCES health_facilities(facility_id),
  referring_doctor_id UUID REFERENCES users(user_id),
  reason TEXT NOT NULL,
  recommended_specialty VARCHAR(100),
  priority referral_priority DEFAULT 'ROUTINE',
  status referral_status DEFAULT 'INITIATED',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_patient_id ON referrals(patient_id);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE TABLE facility_inventory (
  inventory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES health_facilities(facility_id),
  item_code VARCHAR(50) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  batch_number VARCHAR(100),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_facility_inventory_facility_id ON facility_inventory(facility_id);

CREATE TABLE sos_alerts (
  alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id),
  gps_lat DOUBLE PRECISION NOT NULL,
  gps_lng DOUBLE PRECISION NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ambulance_notified_at TIMESTAMPTZ,
  hospital_notified_at TIMESTAMPTZ
);

CREATE INDEX idx_sos_alerts_status ON sos_alerts(status);

CREATE TABLE followups (
  followup_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id),
  pathway_type VARCHAR(50) NOT NULL,
  next_due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  missed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_followups_patient_id ON followups(patient_id);
CREATE INDEX idx_followups_status ON followups(status);

CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  ip_address INET,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
