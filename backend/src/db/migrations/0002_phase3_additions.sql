-- Phase 3 additions: diagnostics support (Problem 3) + facility inventory typing
ALTER TABLE facility_inventory ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'medicine';
-- item_type values: 'medicine' | 'diagnostic_test' | 'equipment'

ALTER TABLE encounters ADD COLUMN IF NOT EXISTS diagnostic_report_url TEXT;
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS diagnostic_status VARCHAR(20);
-- diagnostic_status values: 'requested' | 'in_progress' | 'reported'

CREATE INDEX IF NOT EXISTS idx_facility_inventory_item_type ON facility_inventory(item_type);
