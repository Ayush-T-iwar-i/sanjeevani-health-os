-- Phase 4: offline delta-sync tracking (Problem 8)
CREATE TABLE IF NOT EXISTS sync_mutations (
  mutation_id UUID PRIMARY KEY,             -- client-generated, used for idempotency
  device_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(user_id),
  table_name VARCHAR(50) NOT NULL,
  operation VARCHAR(10) NOT NULL,
  record_id UUID NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT FALSE,
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_mutations_device ON sync_mutations(device_id);

-- Tracks each device's last successful pull, so /api/sync/pull can send only deltas
CREATE TABLE IF NOT EXISTS sync_watermarks (
  device_id VARCHAR(100) PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
