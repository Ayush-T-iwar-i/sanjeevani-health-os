import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import { redis } from '../../config/redis';
import { SignalingRoom } from './consultation.model';

const ROOM_PREFIX = 'webrtc:room:';
const ROOM_TTL = 3600;

export async function createSignalingRoom(
  consultationId: string,
  patientId: string,
  providerId: string,
  audioOnly = false
): Promise<SignalingRoom> {
  const roomId = uuidv4();
  const room: SignalingRoom = {
    roomId,
    consultationId,
    patientId,
    providerId,
    audioOnly,
  };

  await redis.setex(`${ROOM_PREFIX}${roomId}`, ROOM_TTL, JSON.stringify(room));
  await redis.setex(`${ROOM_PREFIX}consultation:${consultationId}`, ROOM_TTL, roomId);

  return room;
}

export async function getSignalingRoom(roomId: string): Promise<SignalingRoom | null> {
  const data = await redis.get(`${ROOM_PREFIX}${roomId}`);
  return data ? (JSON.parse(data) as SignalingRoom) : null;
}

export async function getRoomByConsultation(consultationId: string): Promise<SignalingRoom | null> {
  const roomId = await redis.get(`${ROOM_PREFIX}consultation:${consultationId}`);
  if (!roomId) return null;
  return getSignalingRoom(roomId);
}

export function generateLiveKitToken(_roomId: string, _participantId: string): string | null {
  return null;
}

interface SignalPayload {
  roomId: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'hangup';
  data: unknown;
}

export function handleSignaling(socket: Socket, io: Server): void {
  socket.on('join_consultation_room', async (roomId: string, callback?: (err?: string) => void) => {
    const room = await getSignalingRoom(roomId);
    if (!room) {
      callback?.('Room not found or expired');
      return;
    }

    const userId = socket.data.user.userId;
    if (userId !== room.patientId && userId !== room.providerId) {
      callback?.('Not authorized for this room');
      return;
    }

    socket.join(`consultation:${roomId}`);
    callback?.();
  });

  socket.on('webrtc_signal', (payload: SignalPayload) => {
    socket.to(`consultation:${payload.roomId}`).emit('webrtc_signal', {
      ...payload,
      from: socket.data.user.userId,
    });
  });

  socket.on('consultation_media_mode', (roomId: string, audioOnly: boolean) => {
    io.to(`consultation:${roomId}`).emit('media_mode_changed', { audioOnly });
  });
}
