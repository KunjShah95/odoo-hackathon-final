import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(apiUrl: string) {
  if (!socket) {
    socket = io(apiUrl, { transports: ['websocket'] });
  }
  return socket;
}
