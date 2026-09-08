import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

let sharedSocket: Socket | null = null;

function getSocket(): Socket | null {
  const token = localStorage.getItem('sanjeevani_jwt');
  if (!token) return null;

  if (!sharedSocket || sharedSocket.disconnected) {
    sharedSocket = io(API_BASE_URL, { auth: { token } });
  }
  return sharedSocket;
}

export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const wrapped = (payload: T) => handlerRef.current(payload);
    socket.on(event, wrapped);
    return () => {
      socket.off(event, wrapped);
    };
  }, [event]);
}

export function useSocket(): Socket | null {
  return getSocket();
}