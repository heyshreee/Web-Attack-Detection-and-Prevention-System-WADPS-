import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import logger from './config/logger.js';
import blacklistCheck from './middleware/blacklistCheck.js';
import detectionEngine from './middleware/detectionEngine.js';
import preventionEngine from './middleware/preventionEngine.js';
import { securityState } from './config/securityState.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import logRoutes from './routes/logRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import sqliRoutes from './routes/sqliRoutes.js';
import xssRoutes from './routes/xssRoutes.js';
import cmdRoutes from './routes/cmdRoutes.js';
import traversalRoutes from './routes/traversalRoutes.js';
import bruteForceRoutes from './routes/bruteForceRoutes.js';
import headerRoutes from './routes/headerRoutes.js';
import scannerRoutes from './routes/scannerRoutes.js';
import { dbStore } from './services/dbStore.js';

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

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for robust dashboards
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  handler: async (req, res) => {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const blockReason = 'Rate Limit Abuse / DoS Attempt';
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes ban

    try {
      // 1. Blacklist the IP address
      await dbStore.createBlockedIP({
        ip,
        reason: blockReason,
        expiresAt
      });

      // 2. Log attack telemetry
      await dbStore.createAttackLog({
        attackType: 'Rate Limit Abuse',
        severity: 'HIGH',
        payload: `IP exceeded request limits on route: ${req.originalUrl}`,
        url: req.originalUrl,
        method: req.method,
        ip,
        userAgent
      });

      // 3. Create critical dashboard alert
      await dbStore.createAlert({
        level: 'CRITICAL',
        title: 'Rate Limit Abuse - IP Blocked',
        message: `IP address ${ip} was automatically blacklisted for 30 minutes due to excessive request volume (DoS pattern match).`
      });

      logger.warn(`[RATE LIMIT BANNED] IP ${ip} automatically blacklisted for rate limit abuse.`);

    } catch (err) {
      logger.error(`Error processing rate limit auto-block: ${err.message}`);
    }

    res.status(429).json({
      blocked: true,
      error: 'Too Many Requests',
      message: 'Your IP address has been automatically blocked for 30 minutes due to excessive traffic (DoS Attempt).',
      reason: blockReason
    });
  }
});
app.use(limiter);

// Request Monitoring Middleware (runs first to track total requests and block statistics)
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMsg = `${req.ip} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Agent: ${req.headers['user-agent']} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }

    // Save request telemetry into our store service
    dbStore.createRequestLog({
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'] || 'Unknown',
      statusCode: res.statusCode,
      duration,
    }).catch(err => {
      logger.error(`Error saving RequestLog: ${err.message}`);
    });
  });

  next();
});

// WADPS Security Shield Filters (runs on all requests)
app.use(blacklistCheck);
app.use((req, res, next) => {
  if (securityState.active) {
    preventionEngine(req, res, next);
  } else {
    detectionEngine(req, res, next);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.status(200).json('Api is running...');
});

// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sqli-machine', sqliRoutes);
app.use('/api/xss-machine', xssRoutes);
app.use('/api/cmd-machine', cmdRoutes);
app.use('/api/traversal-machine', traversalRoutes);
app.use('/api/brute-force-machine', bruteForceRoutes);
app.use('/api/header-machine', headerRoutes);
app.use('/api/scanner-machine', scannerRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}\nStack: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.'
  });
});

export default app;
