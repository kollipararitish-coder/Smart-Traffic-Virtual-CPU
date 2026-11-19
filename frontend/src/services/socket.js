/**
 * socket.js
 * Socket.IO Real-Time Connection Singleton
 */

import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000
});
