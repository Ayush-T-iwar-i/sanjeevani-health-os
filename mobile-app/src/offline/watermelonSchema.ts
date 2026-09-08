import { appSchema, tableSchema } from '@nozbe/watermelondb/Schema';

export const watermelonSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'patients',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'blood_type', type: 'string', isOptional: true },
        { name: 'allergies', type: 'string', isOptional: true }, // JSON string
        { name: 'chronic_conditions', type: 'string', isOptional: true },
        { name: 'is_pregnant', type: 'boolean', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'encounters',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'patient_local_id', type: 'string' },
        { name: 'triage_category', type: 'string', isOptional: true },
        { name: 'chief_complaints', type: 'string' }, // JSON array string
        { name: 'vitals_payload', type: 'string' }, // JSON object string
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'referrals',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'patient_local_id', type: 'string' },
        { name: 'reason', type: 'string' },
        { name: 'priority', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'mutation_id', type: 'string' },
        { name: 'table_name', type: 'string' },
        { name: 'operation', type: 'string' },
        { name: 'record_id', type: 'string' },
        { name: 'payload', type: 'string' }, // JSON string
        { name: 'client_timestamp', type: 'number' },
        { name: 'attempted', type: 'boolean' },
      ],
    }),
  ],
});
