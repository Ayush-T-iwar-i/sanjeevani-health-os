import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AuthPayload } from '../gateway/authMiddleware';
import { initSocketForwarders } from './eventBus';
import { handleSignaling } from '../modules/consultations/webrtc.signaling';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN.split(','), credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthPayload;
    logger.info(`Socket connected: ${user.userId} (${user.role})`);

    socket.join(`user:${user.userId}`);
    if (user.facilityId) {
      socket.join(`facility:${user.facilityId}`);
    }
    if (user.role === 'doctor') {
      socket.join('doctors');
    }

    handleSignaling(socket, io!);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${user.userId}`);
    });
  });

  initSocketForwarders((event, payload) => {
    broadcastEvent(event, payload);
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function broadcastEvent(event: string, payload: unknown): void {
  if (!io) return;

  const data = payload as Record<string, unknown>;

  switch (event) {
    case 'appointment_updated':
      if (data.facilityId) {
        io.to(`facility:${data.facilityId}`).emit(event, payload);
      }
      break;
    case 'consultation_call_incoming':
      if (data.providerId) {
        io.to(`user:${data.providerId}`).emit(event, payload);
      }
      io.to('doctors').emit(event, payload);
      break;
    case 'sos_alert_broadcast':
      io.emit(event, payload);
      break;
    default:
      if (data.facilityId) {
        io.to(`facility:${data.facilityId}`).emit(event, payload);
      }
      break;
  }
}
