import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectRedis } from './config/redis';
import { initSocketServer } from './events/socket';
import { startNoShowWatcher, stopNoShowWatcher } from './modules/referrals/noShowWatcher.job';
import { startFollowupSweep, stopFollowupSweep } from './modules/followup/followupSweep.job';
import { startSyncQueueWorker, stopSyncQueueWorker } from './sync/syncQueue.worker';

async function main() {
  await connectRedis();

  const app = createApp();
  const server = createServer(app);
  initSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info(`Sanjeevani backend running on port ${env.PORT}`);
  });

  // Background jobs — these were previously defined but never started, so
  // referral no-shows, missed follow-ups, and stale offline devices were
  // never detected in a running server.
  startNoShowWatcher();
  startFollowupSweep();
  startSyncQueueWorker();

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    stopNoShowWatcher();
    stopFollowupSweep();
    stopSyncQueueWorker();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
