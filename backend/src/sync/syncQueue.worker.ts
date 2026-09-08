import { query } from '../config/db';
import { logger } from '../config/logger';

const RETRY_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
let timer: NodeJS.Timeout | null = null;

/**
 * Most mutations apply synchronously inside pushMutations(). This worker
 * exists for the retry path: if a device's connectivity drops mid-push, or a
 * transient DB error occurs, unresolved mutations are logged (applied=FALSE
 * would need to be persisted by the caller on error) and retried here rather
 * than silently lost. In the current pushMutations() implementation, failed
 * rows are NOT persisted to sync_mutations (only successes are), so the
 * client's own retry-on-reconnect logic is the primary recovery path; this
 * worker's job is purely observability — flagging devices that haven't
 * synced in a long time so field staff can be alerted.
 */
export async function checkStaleDevices(): Promise<void> {
  const { rows } = await query<{ device_id: string; last_synced_at: string }>(
    `SELECT device_id, last_synced_at FROM sync_watermarks WHERE last_synced_at < NOW() - INTERVAL '7 days'`
  );
  if (rows.length > 0) {
    logger.warn(`${rows.length} device(s) have not synced in over 7 days`, {
      deviceIds: rows.map((r) => r.device_id),
    });
  }
}

export function startSyncQueueWorker(): void {
  if (timer) return;
  timer = setInterval(checkStaleDevices, RETRY_INTERVAL_MS);
  void checkStaleDevices();
  logger.info('Sync queue worker started (stale-device check every 5 min)');
}

export function stopSyncQueueWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
