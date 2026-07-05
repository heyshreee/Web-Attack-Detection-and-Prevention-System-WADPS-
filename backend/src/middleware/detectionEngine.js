import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';

// Recursive function to scan an object/array/string for attack vectors
export const scanObject = (obj, checkFn) => {
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
export const hasSQLi = (str) => {
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
export const hasXSS = (str) => {
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
export const hasPathTraversal = (str) => {
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
export const hasCommandInjection = (str) => {
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

// Main Security Detection Middleware (Detection-Only, passive logging)
const detectionEngine = async (req, res, next) => {
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

    // If an attack pattern is identified, log it passively but do NOT block
    if (attackType && matchedPayload) {
      const ip = req.ip;
      
      const logMessage = `[SECURITY DETECTED (PASSIVE)] ${attackType} detected from IP ${ip} - Payload: "${matchedPayload}" on ${req.method} ${req.originalUrl}`;
      logger.info(logMessage);

      // Save passive audit log
      try {
        await dbStore.createAttackLog({
          attackType,
          severity: 'LOW',
          payload: String(matchedPayload),
          url: req.originalUrl,
          method: req.method,
          ip,
          userAgent: req.headers['user-agent'] || 'Unknown',
        });

        await dbStore.createAlert({
          level: 'INFO',
          title: `${attackType} Detected (Passive)`,
          message: `${attackType} originating from IP ${ip} targeting ${req.method} ${req.originalUrl} was parsed and monitored. Request allowed (Prevention Shield is OFF). Payload: "${matchedPayload}"`,
        });
      } catch (dbErr) {
        logger.error(`Failed to save passive attack metrics: ${dbErr.message}`);
      }
    }

    // Go to next middleware
    next();
  } catch (err) {
    logger.error(`Detection Engine internal error: ${err.message}`);
    next();
  }
};

export default detectionEngine;
