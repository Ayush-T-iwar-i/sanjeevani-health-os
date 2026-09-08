import { sweepMissedFollowups } from './followup.service';
import { logger } from '../../config/logger';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day

let timer: NodeJS.Timeout | null = null;

export async function runFollowupSweep(): Promise<void> {
  try {
    await sweepMissedFollowups();
    logger.info('Followup sweep completed');
  } catch (err) {
    logger.error('Followup sweep failed', err);
  }
}

export function startFollowupSweep(): void {
  if (timer) return;
  timer = setInterval(runFollowupSweep, CHECK_INTERVAL_MS);
  void runFollowupSweep();
  logger.info('Followup sweep job started (interval: 24h)');
}

export function stopFollowupSweep(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
