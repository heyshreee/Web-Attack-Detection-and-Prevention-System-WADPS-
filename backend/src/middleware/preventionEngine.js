import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';
import {
  scanObject,
  hasSQLi,
  hasXSS,
  hasPathTraversal,
  hasCommandInjection,
  checkBruteForce,
  hasSuspiciousHeader,
  isScanner
} from './detectionEngine.js';

// IPs and origins that are always trusted — never WAF-scanned or auto-blocked
const TRUSTED_IPS = [
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
];

const TRUSTED_ORIGINS = [
  'https://wadps.vercel.app',
  'https://apiwadps.vercel.app',
];

// Prevention Engine Middleware (Active blocking & IP blacklisting)
const preventionEngine = async (req, res, next) => {
  // Bypass WAF inspection for admin control panel and log viewer
  if (req.originalUrl.startsWith('/api/admin') || req.originalUrl.startsWith('/api/logs')) {
    return next();
  }

  // Bypass for trusted IPs and official Vercel domains
  const clientIPCheck = req.ip || '';
  const originCheck = req.headers.origin || '';
  if (TRUSTED_IPS.includes(clientIPCheck) || TRUSTED_ORIGINS.some(o => originCheck.startsWith(o))) {
    return next();
  }

  try {
    let matchedPayload = null;
    let attackType = null;

    const scanTargets = [req.query, req.body, req.params];

    // 1. Scan for SQL Injection
    for (const target of scanTargets) {
      matchedPayload = scanObject(target, hasSQLi);
      if (matchedPayload) {
        attackType = 'SQL Injection';
        break;
      }
    }

    // 2. Scan for XSS
    if (!attackType) {
      for (const target of scanTargets) {
        matchedPayload = scanObject(target, hasXSS);
        if (matchedPayload) {
          attackType = 'XSS Attempt';
          break;
        }
      }
    }

    // 3. Scan for Path Traversal
    if (!attackType) {
      for (const target of scanTargets) {
        matchedPayload = scanObject(target, hasPathTraversal);
        if (matchedPayload) {
          attackType = 'Path Traversal';
          break;
        }
      }
    }

    // 4. Scan for Command Injection
    if (!attackType) {
      for (const target of scanTargets) {
        matchedPayload = scanObject(target, hasCommandInjection);
        if (matchedPayload) {
          attackType = 'Command Injection';
          break;
        }
      }
    }

    // 5. Scan for Brute Force
    if (!attackType) {
      const isLoginRoute = req.originalUrl.includes('/login') || req.originalUrl.includes('/brute-force');
      if (isLoginRoute) {
        const isBrute = await checkBruteForce(req.ip);
        if (isBrute) {
          attackType = 'Brute Force Attempt';
          matchedPayload = `Failed login threshold exceeded (>= 5 failed attempts in 60s)`;
        }
      }
    }

    // 6. Scan for Suspicious Headers
    if (!attackType) {
      matchedPayload = hasSuspiciousHeader(req.headers);
      if (matchedPayload) {
        attackType = 'Suspicious Header';
      }
    }

    // 7. Scan for Scanner Probes
    if (!attackType) {
      matchedPayload = isScanner(req);
      if (matchedPayload) {
        attackType = 'Scanner Detection';
      }
    }

    // If an attack pattern is identified, block and log it
    if (attackType && matchedPayload) {
      const ip = req.ip;
      
      // Get the number of existing attack logs for this IP to determine tier
      let attackCount = 0;
      try {
        attackCount = await dbStore.countAttackLogs({ ip });
      } catch (countErr) {
        logger.error(`Error counting attack logs for IP ${ip}: ${countErr.message}`);
      }

      let severity = 'LOW';
      let actionStatus = 'Warning';
      let responseMessage = `WADPS Security Warning: Suspicious payload detected. Warning 1 of 3.`;
      let httpStatus = 400;

      if (attackCount === 1) {
        severity = 'MEDIUM';
        actionStatus = 'Prevented';
        responseMessage = `WADPS Security Alert: Request blocked. Warning 2 of 3. Next suspicious request will result in an automatic IP ban.`;
      } else if (attackCount >= 2) {
        severity = 'CRITICAL';
        actionStatus = 'Blacklisted';
        responseMessage = `WADPS Security Block: Your IP address (${ip}) has been blacklisted due to repeated security threat payloads.`;
        httpStatus = 403;
      }

      const logMessage = `[SECURITY ${actionStatus.toUpperCase()}] ${attackType} detected from IP ${ip} - Payload: "${matchedPayload}" on ${req.method} ${req.originalUrl} - Status: ${actionStatus}`;
      logger.warn(logMessage);

      // Save Log and Alert using the dbStore abstraction
      try {
        await dbStore.createAttackLog({
          attackType,
          severity,
          payload: String(matchedPayload),
          url: req.originalUrl,
          method: req.method,
          ip,
          userAgent: req.headers['user-agent'] || 'Unknown',
        });

        if (severity === 'CRITICAL') {
          // Block IP for 24 hours
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await dbStore.createBlockedIP({
            ip,
            reason: `Repeated security threat payloads: ${attackType}`,
            expiresAt,
          });

          await dbStore.createAlert({
            level: 'CRITICAL',
            title: `IP Blacklisted Automatically: ${ip}`,
            message: `IP address ${ip} was blacklisted for 24 hours due to executing repeated attack payloads. Last exploit: ${attackType}.`,
          });
        } else {
          await dbStore.createAlert({
            level: severity === 'LOW' ? 'INFO' : 'WARNING',
            title: `${attackType} Intercepted (${actionStatus})`,
            message: `${attackType} originating from IP ${ip} targeting ${req.method} ${req.originalUrl} (${actionStatus} warnings). Payload: "${matchedPayload}"`,
          });
        }
      } catch (dbErr) {
        logger.error(`Failed to save attack metrics: ${dbErr.message}`);
      }

      // Block request and return error response
      return res.status(httpStatus).json({
        blocked: true,
        status: actionStatus,
        error: httpStatus === 403 ? 'Access Denied' : 'Security Threat Detected',
        message: responseMessage,
        type: attackType,
        payload: matchedPayload,
      });
    }

    // Go to next middleware (no threat detected)
    next();
  } catch (err) {
    logger.error(`Prevention Engine internal error: ${err.message}`);
    next(); // Fallback: allow request to prevent availability failure
  }
};

export default preventionEngine;
