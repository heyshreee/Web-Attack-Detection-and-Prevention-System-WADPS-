import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  // Disable command buffering so operations fail fast when the database is offline/unreachable
  mongoose.set('bufferCommands', false);

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wadps', {
      serverSelectionTimeoutMS: 3000, // Timeout connection attempts fast (3 seconds)
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    logger.warn('The application is running, but database operations will fail. Verify your MongoDB service is running.');
  }
};

export default connectDB;
