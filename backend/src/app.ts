import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiRateLimiter } from './gateway/rateLimiter';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import patientRoutes from './modules/patients/patient.routes';
import triageRoutes from './modules/triage/triage.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import consultationRoutes from './modules/consultations/consultation.routes';
import facilityRoutes from './modules/facilities/facility.routes';
import referralRoutes from './modules/referrals/referral.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import followupRoutes from './modules/followup/followup.routes';
import syncRoutes from './sync/sync.routes';
import emergencyRoutes from './modules/emergency/emergency.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(apiRateLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'sanjeevani-backend', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/triage', triageRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/consultations', consultationRoutes);
  app.use('/api/facilities', facilityRoutes);
  app.use('/api/referrals', referralRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/followups', followupRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/emergency', emergencyRoutes);
  app.use('/api/analytics', analyticsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}