import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(uri);
    console.log(`\x1b[32m✓ MongoDB connected:\x1b[0m ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('\x1b[31m✗ MongoDB connection error:\x1b[0m', err.message);
    process.exit(1);
  }
}
