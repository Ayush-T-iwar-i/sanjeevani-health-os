import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectRedis } from './config/redis';
import { initSocketServer } from './events/socket';

async function main() {
  await connectRedis();

  const app = createApp();
  const server = createServer(app);
  initSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info(`Sanjeevani backend running on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
