import { Server } from 'socket.io';
import { env } from './config/env.js';
import { verifyToken } from './utils/token.js';
import User from './models/User.js';
import Message from './models/Message.js';
import { persistMessage } from './controllers/messageController.js';

// Tracks how many live sockets each user has open (for presence/online dots).
const online = new Map();

function roomFor(userId) {
  return `user:${userId}`;
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  // Authenticate every socket via the JWT (handshake auth or cookie header).
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers.cookie) {
        const match = socket.handshake.headers.cookie.match(/token=([^;]+)/);
        if (match) token = decodeURIComponent(match[1]);
      }
      if (!token) return next(new Error('Unauthorized'));
      const { id } = verifyToken(token);
      const user = await User.findById(id).select('name email avatar role');
      if (!user) return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const uid = String(socket.user._id);
    socket.join(roomFor(uid));

    // Presence bookkeeping + broadcast.
    online.set(uid, (online.get(uid) || 0) + 1);
    io.emit('presence:update', { userId: uid, online: true });
    // Tell the newcomer who is already online.
    socket.emit('presence:list', [...online.keys()]);

    // Send a message in real time.
    socket.on('message:send', async ({ to, body }, ack) => {
      try {
        const msg = await persistMessage(socket.user, to, body);
        const payload = msg.toObject ? msg.toObject() : msg;
        io.to(roomFor(to)).emit('message:new', payload);
        io.to(roomFor(uid)).emit('message:new', payload);
        ack?.({ ok: true, message: payload });
      } catch (err) {
        ack?.({ ok: false, error: err.message || 'Could not send message' });
      }
    });

    // Typing indicator passthrough.
    socket.on('typing', ({ to, typing }) => {
      io.to(roomFor(to)).emit('typing', { from: uid, typing });
    });

    // Mark a conversation's incoming messages as read.
    socket.on('message:read', async ({ from }) => {
      await Message.updateMany(
        { sender: from, recipient: uid, read: false },
        { read: true }
      );
      io.to(roomFor(from)).emit('message:read', { by: uid });
    });

    socket.on('disconnect', () => {
      const count = (online.get(uid) || 1) - 1;
      if (count <= 0) {
        online.delete(uid);
        io.emit('presence:update', { userId: uid, online: false });
      } else {
        online.set(uid, count);
      }
    });
  });

  return io;
}
