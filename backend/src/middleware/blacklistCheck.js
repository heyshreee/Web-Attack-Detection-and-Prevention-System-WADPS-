import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';
import { securityState } from '../config/securityState.js';

const blacklistCheck = async (req, res, next) => {
  // Bypass if security settings are turned OFF
  if (!securityState.active) {
    return next();
  }

  try {
    const clientIP = req.ip;

    // Check if the IP is blacklisted in the store (DB or In-Memory)
    const blockRecord = await dbStore.findBlockedIP(clientIP);

    if (blockRecord) {
      // Check for expiry if set
      if (blockRecord.expiresAt && new Date() > new Date(blockRecord.expiresAt)) {
        // Block has expired, remove block record
        await dbStore.deleteBlockedIP(clientIP);
        logger.info(`Auto-unblocked expired blacklisted IP: ${clientIP}`);
        return next();
      }

      // IP is active on the blacklist, abort request
      logger.warn(`[BLACKLIST BLOCKED] Blocked IP ${clientIP} attempted to access ${req.method} ${req.originalUrl}`);
      
      return res.status(403).json({
        blocked: true,
        error: 'Access Denied',
        message: `Your IP address (${clientIP}) is blacklisted by WADPS.`,
        reason: blockRecord.reason,
      });
    }

    next();
  } catch (err) {
    logger.error(`Blacklist Check internal error: ${err.message}`);
    next(); // Fallback: proceed to avoid system denial of service
  }
};

export default blacklistCheck;
