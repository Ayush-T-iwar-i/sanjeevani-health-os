import { query } from '../config/db';
import { resolveMutation, Mutation } from './conflictResolver';
import { logger } from '../config/logger';

// Whitelisted tables + columns that mobile devices are allowed to sync.
// Keeps the generic apply-mutation logic safe from arbitrary SQL injection
// via table/column names supplied by the client.
const SYNCABLE_TABLES: Record<string, string[]> = {
  patients: ['name', 'phone', 'blood_type', 'allergies', 'chronic_conditions', 'current_medications', 'is_pregnant', 'updated_at'],
  encounters: ['patient_id', 'provider_id', 'facility_id', 'triage_category', 'chief_complaints', 'vitals_payload', 'offline_created_at'],
  facility_inventory: ['delta'], // PN-counter: only a delta is ever sent
};

export async function pushMutations(deviceId: string, userId: string, mutations: Mutation[]) {
  const results: { mutationId: string; status: 'applied' | 'skipped' | 'error'; error?: string }[] = [];

  for (const mutation of mutations) {
    try {
      // Idempotency: skip if this mutation_id was already processed
      const { rows: existing } = await query(`SELECT 1 FROM sync_mutations WHERE mutation_id = $1`, [mutation.mutationId]);
      if (existing.length > 0) {
        results.push({ mutationId: mutation.mutationId, status: 'skipped' });
        continue;
      }

      const allowedColumns = SYNCABLE_TABLES[mutation.table];
      if (!allowedColumns) {
        throw new Error(`Table '${mutation.table}' is not sync-enabled`);
      }

      if (mutation.table === 'facility_inventory') {
        // PN-counter path: apply delta directly, order-independent
        await query(
          `UPDATE facility_inventory SET quantity_available = GREATEST(quantity_available + $1, 0), updated_at = NOW() WHERE inventory_id = $2`,
          [mutation.payload.delta, mutation.recordId]
        );
      } else {
        const { rows: currentRows } = await query(
          `SELECT * FROM ${mutation.table} WHERE ${mutation.table === 'patients' ? 'patient_id' : 'encounter_id'} = $1`,
          [mutation.recordId]
        );
        const resolved = resolveMutation(mutation, (currentRows[0] as any) ?? null);

        if (resolved) {
          if (mutation.table === 'encounters') {
            // Append-only: always INSERT a new row
            const cols = Object.keys(resolved).filter((c) => allowedColumns.includes(c));
            const values = cols.map((c) => resolved[c]);
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
            await query(
              `INSERT INTO encounters (encounter_id, ${cols.join(', ')}, synced_from_offline, server_received_at)
               VALUES (uuid_generate_v4(), ${placeholders}, TRUE, NOW())`,
              values
            );
          } else {
            // LWW: UPSERT
            const cols = Object.keys(resolved).filter((c) => allowedColumns.includes(c));
            const setClause = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
            const values = cols.map((c) => resolved[c]);
            await query(
              `UPDATE patients SET ${setClause} WHERE patient_id = $1`,
              [mutation.recordId, ...values]
            );
          }
        }
      }

      await query(
        `INSERT INTO sync_mutations (mutation_id, device_id, user_id, table_name, operation, record_id, applied, client_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)`,
        [mutation.mutationId, deviceId, userId, mutation.table, mutation.operation, mutation.recordId, mutation.clientTimestamp]
      );

      results.push({ mutationId: mutation.mutationId, status: 'applied' });
    } catch (err) {
      logger.error('Sync mutation failed', { mutation, err: (err as Error).message });
      results.push({ mutationId: mutation.mutationId, status: 'error', error: (err as Error).message });
    }
  }

  await query(
    `INSERT INTO sync_watermarks (device_id, user_id, last_synced_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (device_id) DO UPDATE SET last_synced_at = NOW()`,
    [deviceId, userId]
  );

  return results;
}

export async function pullChanges(deviceId: string) {
  const { rows: watermarkRows } = await query<{ last_synced_at: string }>(
    `SELECT last_synced_at FROM sync_watermarks WHERE device_id = $1`,
    [deviceId]
  );
  const since = watermarkRows[0]?.last_synced_at ?? '1970-01-01';

  const { rows: patients } = await query(`SELECT * FROM patients WHERE updated_at > $1`, [since]);
  const { rows: encounters } = await query(`SELECT * FROM encounters WHERE server_received_at > $1`, [since]);
  const { rows: appointments } = await query(`SELECT * FROM appointments WHERE created_at > $1`, [since]);
  const { rows: referrals } = await query(`SELECT * FROM referrals WHERE created_at > $1`, [since]);

  return {
    since,
    now: new Date().toISOString(),
    changes: { patients, encounters, appointments, referrals },
  };
}
