import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';
import { securityState } from '../config/securityState.js';

// Recursive function to scan an object/array/string for attack vectors
const scanObject = (obj, checkFn) => {
  if (typeof obj === 'string') {
    return checkFn(obj) ? obj : null;
  }
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const match = scanObject(item, checkFn);
      if (match) return match;
    }
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const match = scanObject(obj[key], checkFn);
      if (match) return match;
    }
  }
  return null;
};

// SQL Injection Patterns
const hasSQLi = (str) => {
  const sqliRegexes = [
    /\b(select|union|insert|update|delete|drop|alter|where|from|truncate|grant|revoke)\b/i,
    /\b(and|or)\b\s+[\d'=]+\s*=\s*[\d'=]+/i,
    /(--|#|\/\*|\*\/)/i,
    /union\s+all\s+select/i,
    /'\s*(or|and)\s*.*=.*'/i,
  ];
  return sqliRegexes.some(regex => regex.test(str));
};

// Cross-Site Scripting (XSS) Patterns
const hasXSS = (str) => {
  const xssRegexes = [
    /<script[^>]*>([\s\S]*?)<\/script>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /<svg[^>]*>([\s\S]*?)<\/svg>/i,
    /<iframe[^>]*>([\s\S]*?)<\/iframe>/i,
    /srcdoc\s*=/i,
    /alert\s*\(/i,
    /eval\s*\(/i,
  ];
  return xssRegexes.some(regex => regex.test(str));
};

// Path Traversal Patterns
const hasPathTraversal = (str) => {
  const traversalRegexes = [
    /\.\.\//, // ../
    /\.\.\\/, // ..\
    /\b(boot\.ini|etc\/passwd|etc\/hosts|etc\/shadow|win\.ini)\b/i,
    /\/var\/log\//i,
    /\b(system32|system\.ini)\b/i
  ];
  return traversalRegexes.some(regex => regex.test(str));
};

// Command Injection Patterns
const hasCommandInjection = (str) => {
  const dangerousPunctuation = /[;&|`]|(\$\()/.test(str);
  const commandWord = /\b(whoami|id|uname|ifconfig|ipconfig|netstat|ping|curl|wget|powershell|cmd|bash|sh|nc|ncat|netcat|cat\s+|type\s+|ls\s+|dir\s+)\b/i.test(str);

  if (dangerousPunctuation && commandWord) {
    return true;
  }

  const directExecRegexes = [
    /cat\s+\/etc\/(passwd|hosts|shadow)/i,
    /ping\s+(-[c|t]\s+)?\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
    /curl\s+https?:\/\//i,
    /wget\s+https?:\/\//i,
    /\brm\s+-rf\b/i
  ];
  return directExecRegexes.some(regex => regex.test(str));
};

// Main Security Detection Middleware
const detectionEngine = async (req, res, next) => {
  // Bypass analysis if security is turned OFF
  if (!securityState.active) {
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

    // If an attack pattern is identified, block and log it
    if (attackType && matchedPayload) {
      const severity = 'HIGH';
      const logMessage = `[SECURITY BLOCKED] ${attackType} detected from IP ${req.ip} - Payload: "${matchedPayload}" on ${req.method} ${req.originalUrl}`;
      logger.warn(logMessage);

      // Save Log and Alert using the dbStore abstraction
      try {
        await dbStore.createAttackLog({
          attackType,
          severity,
          payload: String(matchedPayload),
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || 'Unknown',
        });

        await dbStore.createAlert({
          level: 'CRITICAL',
          title: `${attackType} Blocked`,
          message: `${attackType} originating from IP ${req.ip} targeting ${req.method} ${req.originalUrl}. Payload: "${matchedPayload}"`,
        });
      } catch (dbErr) {
        logger.error(`Failed to save attack metrics: ${dbErr.message}`);
      }

      // Block request and return error response
      return res.status(400).json({
        blocked: true,
        error: 'Security Threat Detected',
        message: 'Your request was blocked by WADPS security filters.',
        type: attackType,
        payload: matchedPayload,
      });
    }

    // Go to next middleware
    next();
  } catch (err) {
    logger.error(`Security Engine internal error: ${err.message}`);
    next(); // Fallback: allow request to prevent availability failure
  }
};

export default detectionEngine;
