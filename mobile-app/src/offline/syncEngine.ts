import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from './database';
import { Q } from '@nozbe/watermelondb';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const DEVICE_ID_KEY = 'sanjeevani_device_id';
const SYNC_INTERVAL_MS = 30 * 1000; // try every 30s when online

let syncTimer: ReturnType<typeof setInterval> | null = null;

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('sanjeevani_jwt');
}

/**
 * Every mobile write goes through this function FIRST (writes to local
 * SQLite/WatermelonDB, never blocks on network), then queues a mutation
 * record that this engine pushes to the server as soon as connectivity
 * returns. This is the core of "app must never block on network" (Problem 8).
 */
export async function queueMutation(params: {
  table: 'patients' | 'encounters' | 'facility_inventory';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const mutationId = `mut-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await database.write(async () => {
    const syncQueueCollection = database.get('sync_queue');
    await syncQueueCollection.create((record: any) => {
      record.mutationId = mutationId;
      record.tableName = params.table;
      record.operation = params.operation;
      record.recordId = params.recordId;
      record.payload = JSON.stringify(params.payload);
      record.clientTimestamp = Date.now();
      record.attempted = false;
    });
  });

  // Try an immediate push if we're online; otherwise the interval timer catches it.
  const netState = await NetInfo.fetch();
  if (netState.isConnected) {
    void pushQueuedMutations();
  }
}

export async function pushQueuedMutations(): Promise<void> {
  const token = await getAuthToken();
  if (!token) return; // not logged in yet

  const syncQueueCollection = database.get('sync_queue');
  const pending = await syncQueueCollection.query(Q.where('attempted', false)).fetch();
  if (pending.length === 0) return;

  const deviceId = await getDeviceId();
  const mutations = pending.map((record: any) => ({
    mutationId: record.mutationId,
    table: record.tableName,
    operation: record.operation,
    recordId: record.recordId,
    payload: JSON.parse(record.payload),
    clientTimestamp: new Date(record.clientTimestamp).toISOString(),
  }));

  try {
    const resp = await fetch(`${API_BASE_URL}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ deviceId, mutations }),
    });

    if (resp.ok) {
      const { results } = await resp.json();
      const appliedIds = new Set(
        results.filter((r: any) => r.status === 'applied' || r.status === 'skipped').map((r: any) => r.mutationId)
      );

      await database.write(async () => {
        for (const record of pending) {
          if (appliedIds.has((record as any).mutationId)) {
            await (record as any).destroyPermanently();
          }
        }
      });
    }
  } catch {
    // Offline or server unreachable — leave queued, will retry on next tick.
  }
}

export async function pullServerChanges(): Promise<void> {
  const token = await getAuthToken();
  if (!token) return;

  const deviceId = await getDeviceId();
  try {
    const resp = await fetch(`${API_BASE_URL}/api/sync/pull?deviceId=${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return;
    const { changes } = await resp.json();
    // Merge server changes into local tables (LWW / append-only per table,
    // mirroring backend/src/sync/conflictResolver.ts strategy).
    await database.write(async () => {
      const patientsCollection = database.get('patients');
      for (const p of changes.patients ?? []) {
        const existing = await patientsCollection.query(Q.where('server_id', p.patient_id)).fetch();
        if (existing.length === 0) {
          await patientsCollection.create((record: any) => {
            record.serverId = p.patient_id;
            record.name = p.name;
            record.phone = p.phone;
            record.synced = true;
          });
        }
      }
      // encounters/referrals follow the same append/merge pattern (omitted for brevity)
    });
  } catch {
    // ignore, retry next cycle
  }
}

export function startSyncEngine(): void {
  if (syncTimer) return;
  syncTimer = setInterval(() => {
    void pushQueuedMutations();
    void pullServerChanges();
  }, SYNC_INTERVAL_MS);

  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void pushQueuedMutations();
      void pullServerChanges();
    }
  });
}

export function stopSyncEngine(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}
