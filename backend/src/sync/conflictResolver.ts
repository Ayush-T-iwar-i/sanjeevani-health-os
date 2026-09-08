/**
 * Conflict resolution strategies for offline mutations pushed from the mobile
 * app. Chosen per table, exactly per master spec Section 6:
 *  - Patient demographics -> Last-Write-Wins by server timestamp
 *  - Clinical notes/vitals (encounters) -> append-only, never overwritten
 *  - Inventory counts -> PN-counter CRDT (commutative, order-independent)
 */

export type ConflictStrategy = 'LWW' | 'APPEND_ONLY' | 'PN_COUNTER';

const TABLE_STRATEGY: Record<string, ConflictStrategy> = {
  patients: 'LWW',
  users: 'LWW',
  encounters: 'APPEND_ONLY',
  facility_inventory: 'PN_COUNTER',
};

export function strategyForTable(table: string): ConflictStrategy {
  return TABLE_STRATEGY[table] ?? 'LWW';
}

export interface Mutation {
  mutationId: string;       // client-generated UUID, used for idempotency
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: Record<string, unknown>;
  clientTimestamp: string;  // ISO string, when the mutation was made offline
}

/**
 * Resolves a single incoming mutation against the current server state.
 * Returns the SQL-ready payload to apply, or null if the mutation should be
 * dropped (e.g. a stale LWW write that lost to a newer server timestamp).
 */
export function resolveMutation(
  mutation: Mutation,
  serverRecord: { updated_at?: string; [key: string]: unknown } | null
): Record<string, unknown> | null {
  const strategy = strategyForTable(mutation.table);

  switch (strategy) {
    case 'LWW': {
      if (!serverRecord) return mutation.payload; // no conflict, record is new
      const serverTs = serverRecord.updated_at ? new Date(serverRecord.updated_at).getTime() : 0;
      const clientTs = new Date(mutation.clientTimestamp).getTime();
      // Client write only wins if it's strictly newer than the server's last write
      return clientTs > serverTs ? mutation.payload : null;
    }

    case 'APPEND_ONLY': {
      // Clinical notes/vitals are never overwritten — every mutation becomes
      // a new row (INSERT), regardless of whether a "matching" record exists.
      return mutation.payload;
    }

    case 'PN_COUNTER': {
      // Inventory deltas are commutative: apply the delta directly rather
      // than the absolute payload, so ordering/duplication doesn't matter.
      // Expects payload to contain a numeric `delta` field.
      if (typeof mutation.payload.delta !== 'number') {
        throw new Error(`PN_COUNTER mutation for ${mutation.table} must include a numeric 'delta'`);
      }
      return mutation.payload;
    }

    default:
      return mutation.payload;
  }
}
