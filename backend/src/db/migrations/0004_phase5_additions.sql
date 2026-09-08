-- Phase 5: notifications + emergency escalation support
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_asha_id UUID REFERENCES users(user_id);

CREATE INDEX IF NOT EXISTS idx_patients_assigned_asha ON patients(assigned_asha_id);