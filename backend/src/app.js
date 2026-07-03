import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from './config/logger.js';

dotenv.config();

const app = express();

// Standard Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // Allow all for demo purposes, can restrict to frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Module 2: Request Monitoring Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Capture response status on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMsg = `${req.ip} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Agent: ${req.headers['user-agent']} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}\nStack: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.'
  });
});

export default app;
