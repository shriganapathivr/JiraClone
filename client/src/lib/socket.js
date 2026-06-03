import { io } from 'socket.io-client';

// Single shared socket. Connects to the same origin; the Vite dev proxy
// forwards /socket.io to the API server, and in production it's same-origin.
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('zira_token') },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: localStorage.getItem('zira_token') };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
