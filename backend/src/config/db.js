import mongoose from 'mongoose';
import logger from './logger.js';
import { seedDatabase } from '../services/dbStore.js';

const connectDB = async () => {
  // Disable buffering so queries fail fast if connection is down
  mongoose.set('bufferCommands', false);

  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/wadps';

  if (!primaryUri) {
    logger.warn('No MONGO_URI env variable set. Trying local MongoDB...');
    try {
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      logger.info(`MongoDB Connected (Local): ${conn.connection.host}`);
      await seedDatabase();
      return;
    } catch (err) {
      logger.error(`MongoDB Connection Failed (Local): ${err.message}`);
      logger.warn('The application is running, but database operations will fail. Verify your MongoDB service is running.');
      return;
    }
  }

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 4000, // Timeout connection attempts to Atlas fast
    });
    logger.info(`MongoDB Connected (Primary): ${conn.connection.host}`);
    await seedDatabase();
  } catch (error) {
    logger.warn(`Primary MongoDB Connection Failed: ${error.message}`);
    logger.info(`Attempting fallback to local MongoDB (${fallbackUri})...`);
    
    try {
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      logger.info(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
      await seedDatabase();
    } catch (fallbackError) {
      logger.error(`MongoDB Connection Failed on both primary and fallback URIs.`);
      logger.warn('The application is running, but database operations will fail. Verify your MongoDB service is running.');
    }
  }
};

export default connectDB;
