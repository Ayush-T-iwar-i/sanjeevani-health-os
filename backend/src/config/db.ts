import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', err);
});

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  const result = await pool.query(text, params);
  logger.debug('Executed query', { text, duration: Date.now() - start, rows: result.rowCount });
  return { rows: result.rows as T[], rowCount: result.rowCount };
}

export async function getClient() {
  return pool.connect();
}
