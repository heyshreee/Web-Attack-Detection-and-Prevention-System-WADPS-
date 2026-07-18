import winston from 'winston';
import mongoose from 'mongoose';
import SystemLog from '../models/SystemLog.js';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  })
);

// Custom Winston Transport to write logs directly to MongoDB
class MongoDBTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.queue = [];
    
    // Listen for mongoose connection events to flush queued logs
    mongoose.connection.on('connected', () => {
      this.flushQueue();
    });
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, timestamp, ...meta } = info;
    const logEntry = {
      level,
      message,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      meta
    };

    if (mongoose.connection.readyState === 1) {
      this.saveToDB(logEntry);
    } else {
      this.queue.push(logEntry);
    }

    callback();
  }

  async saveToDB(logEntry) {
    try {
      const doc = new SystemLog(logEntry);
      await doc.save();
    } catch (err) {
      // Use console.error directly to avoid recursion
      console.error(`[MongoDBTransport Error] Failed to save log: ${err.message}`);
    }
  }

  async flushQueue() {
    if (this.queue.length === 0) return;
    const logsToFlush = [...this.queue];
    this.queue = [];
    
    try {
      await SystemLog.insertMany(logsToFlush);
    } catch (err) {
      // Use console.error directly to avoid recursion
      console.error(`[MongoDBTransport Error] Failed to flush queued logs: ${err.message}`);
    }
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new MongoDBTransport()
  ]
});

export default logger;
