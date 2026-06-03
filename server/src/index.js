import http from 'http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { initSocket } from './socket.js';

async function start() {
  await connectDB(env.MONGODB_URI);
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server); // attach real-time chat to the same HTTP server
  server.listen(env.PORT, () => {
    console.log(
      `\x1b[36m▸ ZiraClone API\x1b[0m running on \x1b[1mhttp://localhost:${env.PORT}\x1b[0m (${env.NODE_ENV})`
    );
    console.log('\x1b[36m▸ Socket.io\x1b[0m real-time chat ready');
  });
}

start();
