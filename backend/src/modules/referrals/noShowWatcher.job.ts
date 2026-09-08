import { flagOverdueReferrals } from './referral.service';
import { logger } from '../../config/logger';

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes

let timer: NodeJS.Timeout | null = null;

export async function runNoShowCheck(): Promise<void> {
  try {
    const overdue = await flagOverdueReferrals();
    if (overdue.length > 0) {
      logger.info(`No-show watcher: flagged ${overdue.length} referral(s) as NO_SHOW`, {
        referralIds: overdue.map((r) => r.referral_id),
      });
    }
  } catch (err) {
    logger.error('No-show watcher failed', err);
  }
}

/** Call once from server.ts on boot. Idempotent — safe to call once. */
export function startNoShowWatcher(): void {
  if (timer) return;
  timer = setInterval(runNoShowCheck, CHECK_INTERVAL_MS);
  // Run once immediately on boot too
  void runNoShowCheck();
  logger.info('Referral no-show watcher started (interval: 15 min, threshold: 48h due_date)');
}

export function stopNoShowWatcher(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
