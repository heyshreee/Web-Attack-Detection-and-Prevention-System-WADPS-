import express from 'express';
import { securityState } from '../config/securityState.js';
import logger from '../config/logger.js';
import { dbStore } from '../services/dbStore.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authMiddleware to all admin endpoints
router.use(authMiddleware);

// Fetch current security settings
router.get('/security-status', (req, res) => {
  res.status(200).json({ active: securityState.active });
});

// Update security settings (Toggle ON/OFF)
router.post('/security-status', (req, res) => {
  const { active } = req.body;
  
  if (typeof active === 'boolean') {
    securityState.active = active;
    logger.info(`System protection status changed: Security is now ${active ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`);
    
    // Log setting change alert
    dbStore.createAlert({
      level: 'WARNING',
      title: `Firewall Shield Toggled ${active ? 'ON' : 'OFF'}`,
      message: `The WADPS inspection shield was manually turned ${active ? 'ON' : 'OFF'} by operator ${req.user.name}.`,
    }).catch(err => logger.error(`Alert log failure: ${err.message}`));

    return res.status(200).json({ 
      active: securityState.active, 
      message: `WADPS firewall successfully toggled ${active ? 'ON' : 'OFF'}.` 
    });
  }

  res.status(400).json({ error: 'Invalid input. "active" field must be a boolean.' });
});

// Fetch all blocked IPs
router.get('/blocked-ips', async (req, res) => {
  try {
    const list = await dbStore.listBlockedIPs();
    res.status(200).json(list);
  } catch (err) {
    logger.error(`Error listing blocked IPs: ${err.message}`);
    res.status(500).json({ error: 'Server error retrieving blocked IPs' });
  }
});

// Manually block an IP
router.post('/blocked-ips', async (req, res) => {
  try {
    const { ip, reason, expiryHours } = req.body;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required.' });
    }

    const existingBlock = await dbStore.findBlockedIP(ip);
    if (existingBlock) {
      return res.status(400).json({ error: 'IP is already blocked.' });
    }

    let expiresAt = null;
    if (expiryHours && !isNaN(expiryHours)) {
      expiresAt = new Date(Date.now() + parseFloat(expiryHours) * 60 * 60 * 1000);
    }

    const newBlock = await dbStore.createBlockedIP({
      ip,
      reason: reason || 'Manual block by admin',
      expiresAt,
    });

    logger.info(`IP ${ip} manually blocked by admin ${req.user.email}`);

    // Create system alert
    await dbStore.createAlert({
      level: 'WARNING',
      title: 'Manual IP Block Created',
      message: `IP address ${ip} was manually blacklisted by operator ${req.user.name}. Reason: ${reason || 'None provided'}. Expiration: ${expiresAt ? expiresAt.toLocaleString() : 'Permanent'}`,
    });

    res.status(201).json(newBlock);
  } catch (err) {
    logger.error(`Error creating manual block: ${err.message}`);
    res.status(500).json({ error: 'Server error creating IP block' });
  }
});

// Manually unblock an IP
router.delete('/blocked-ips/:ip', async (req, res) => {
  try {
    const { ip } = req.params;

    const result = await dbStore.deleteBlockedIP(ip);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'IP not found in blacklist.' });
    }

    logger.info(`IP ${ip} manually unblocked by admin ${req.user.email}`);

    // Create system alert
    await dbStore.createAlert({
      level: 'INFO',
      title: 'IP Address Unblocked',
      message: `IP address ${ip} was unblocked (whitelisted) by operator ${req.user.name}.`,
    });

    res.status(200).json({ message: `Successfully unblocked IP ${ip}` });
  } catch (err) {
    logger.error(`Error unblocking IP: ${err.message}`);
    res.status(500).json({ error: 'Server error removing IP block' });
  }
});

export default router;
