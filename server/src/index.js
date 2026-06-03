import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  await connectDB(env.MONGODB_URI);
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(
      `\x1b[36m▸ ZiraClone API\x1b[0m running on \x1b[1mhttp://localhost:${env.PORT}\x1b[0m (${env.NODE_ENV})`
    );
  });
}

start();
