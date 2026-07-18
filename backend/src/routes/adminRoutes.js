import express from 'express';
import { securityState } from '../config/securityState.js';
import logger from '../config/logger.js';
import { dbStore } from '../services/dbStore.js';
import authMiddleware from '../middleware/authMiddleware.js';
import AttackLog from '../models/AttackLog.js';
import RequestLog from '../models/RequestLog.js';

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
      message: `The WADPS inspection shield was manually turned ${active ? 'ON' : 'OFF'} by admin ${req.user.name}.`,
    }).catch(err => logger.error(`Alert log failure: ${err.message}`));

    return res.status(200).json({ 
      active: securityState.active, 
      message: `WADPS firewall successfully toggled ${active ? 'ON' : 'OFF'}.` 
    });
  }

  res.status(400).json({ error: 'Invalid input. "active" field must be a boolean.' });
});

// Helper for Country lookup
const getCountryFromIP = (ip) => {
  const map = {
    '192.168.1.20': 'India',
    '192.168.1.55': 'USA',
    '103.23.45.66': 'Singapore',
    '192.168.1.10': 'India',
    '10.0.0.4': 'Germany',
    '172.16.0.22': 'Canada',
    '192.168.1.45': 'UK',
    '8.8.8.8': 'USA',
  };
  if (map[ip]) return map[ip];
  // Deterministic fallback using hash of IP:
  const countries = ['USA', 'India', 'Canada', 'UK', 'Germany', 'Australia', 'Singapore', 'Japan', 'Brazil', 'France'];
  let sum = 0;
  for (let i = 0; i < ip.length; i++) sum += ip.charCodeAt(i);
  return countries[sum % countries.length];
};

// Helper to enrich blocked IP records with SOC stats
const enrichBlockedIP = async (record) => {
  const ip = record.ip;
  let attackCount = 0;
  let requests = 0;
  let targetEndpoint = '/api';
  let country = getCountryFromIP(ip);

  try {
    attackCount = await AttackLog.countDocuments({ ip });
    requests = await RequestLog.countDocuments({ ip });
    
    const latestAttack = await AttackLog.findOne({ ip }).sort({ timestamp: -1 });
    if (latestAttack) {
      targetEndpoint = latestAttack.url;
      if (latestAttack.country && latestAttack.country !== 'Localhost') {
        country = latestAttack.country;
      }
    } else {
      const latestRequest = await RequestLog.findOne({ ip }).sort({ timestamp: -1 });
      if (latestRequest && latestRequest.country && latestRequest.country !== 'Localhost') {
        country = latestRequest.country;
      }
    }
  } catch (err) {
    logger.error(`Error enriching blocked IP stats from MongoDB for ${ip}: ${err.message}`);
  }

  let baseScore = 20;
  const reasonLower = (record.reason || '').toLowerCase();
  
  if (reasonLower.includes('sql')) baseScore = 60;
  else if (reasonLower.includes('xss')) baseScore = 50;
  else if (reasonLower.includes('traversal')) baseScore = 45;
  else if (reasonLower.includes('command')) baseScore = 70;
  else if (reasonLower.includes('brute force')) baseScore = 40;
  else if (reasonLower.includes('rate limit')) baseScore = 30;
  else if (reasonLower.includes('manual')) baseScore = 25;

  let threatScore = baseScore + (attackCount * 4) + (requests * 0.1);
  threatScore = Math.min(100, Math.max(10, Math.round(threatScore)));

  let severity = 'Low';
  if (threatScore > 80) severity = 'Critical';
  else if (threatScore > 60) severity = 'High';
  else if (threatScore > 30) severity = 'Medium';

  let status = record.status || 'Active';
  if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
    status = 'Inactive';
  }

  const blockedBy = (reasonLower.includes('manual') || reasonLower.includes('admin')) 
    ? 'Admin' 
    : 'Automatic Rule';

  return {
    _id: record._id,
    ip: record.ip,
    country,
    reason: record.reason,
    severity,
    threatScore,
    blockedAt: record.blockedAt,
    expiresAt: record.expiresAt,
    status,
    blockedBy,
    attackCount,
    requests,
    targetEndpoint
  };
};

// Helper to calculate statistics
const getBlockedIPStats = (enrichedList) => {
  const stats = {
    totalBlocked: enrichedList.length,
    activeCount: enrichedList.filter(item => item.status === 'Active').length,
    inactiveCount: enrichedList.filter(item => item.status === 'Inactive').length,
    topCountry: 'N/A',
    topAttack: 'N/A',
    avgDuration: 'N/A',
  };

  if (enrichedList.length === 0) return stats;

  const countryCounts = {};
  enrichedList.forEach(item => {
    if (item.country) {
      countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
    }
  });
  const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  if (sortedCountries.length > 0) {
    stats.topCountry = sortedCountries[0][0];
  }

  const attackCounts = {};
  enrichedList.forEach(item => {
    if (item.reason) {
      attackCounts[item.reason] = (attackCounts[item.reason] || 0) + 1;
    }
  });
  const sortedAttacks = Object.entries(attackCounts).sort((a, b) => b[1] - a[1]);
  if (sortedAttacks.length > 0) {
    stats.topAttack = sortedAttacks[0][0];
  }

  let totalMinutes = 0;
  let tempBlockCount = 0;
  enrichedList.forEach(item => {
    if (item.expiresAt) {
      const durationMs = new Date(item.expiresAt) - new Date(item.blockedAt);
      if (durationMs > 0) {
        totalMinutes += durationMs / (60 * 1000);
        tempBlockCount++;
      }
    }
  });

  if (tempBlockCount > 0) {
    const avgMin = totalMinutes / tempBlockCount;
    if (avgMin < 60) {
      stats.avgDuration = `${Math.round(avgMin)} mins`;
    } else {
      stats.avgDuration = `${(avgMin / 60).toFixed(1)} hrs`;
    }
  } else {
    stats.avgDuration = 'Permanent';
  }

  return stats;
};

// Fetch all blocked IPs with full filter/search/sort/pagination support
router.get('/blocked-ips', async (req, res) => {
  try {
    const rawList = await dbStore.listBlockedIPs();
    
    // Enrich all records first
    const enrichedList = await Promise.all(rawList.map(record => enrichBlockedIP(record)));
    
    // Calculate global stats of ALL records (before filtering)
    const stats = getBlockedIPStats(enrichedList);

    // Apply filtering based on query params
    let filteredList = [...enrichedList];
    const { search, status, reason, severity, sort, page = 1, limit = 10 } = req.query;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredList = filteredList.filter(item => 
        item.ip.includes(search) || 
        (item.country && item.country.toLowerCase().includes(searchLower))
      );
    }

    if (status && status !== 'All') {
      filteredList = filteredList.filter(item => item.status === status);
    }

    if (reason && reason !== 'All') {
      filteredList = filteredList.filter(item => {
        const itemReason = (item.reason || '').toLowerCase();
        const filterReason = reason.toLowerCase();
        if (filterReason === 'manual') {
          return itemReason.includes('manual') || itemReason.includes('admin');
        }
        return itemReason.includes(filterReason);
      });
    }

    if (severity && severity !== 'All') {
      filteredList = filteredList.filter(item => item.severity === severity);
    }

    // Apply sorting
    if (sort) {
      if (sort === 'latest') {
        filteredList.sort((a, b) => new Date(b.blockedAt) - new Date(a.blockedAt));
      } else if (sort === 'oldest') {
        filteredList.sort((a, b) => new Date(a.blockedAt) - new Date(b.blockedAt));
      } else if (sort === 'severity') {
        const sevWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        filteredList.sort((a, b) => (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0));
      } else if (sort === 'country') {
        filteredList.sort((a, b) => (a.country || '').localeCompare(b.country || ''));
      }
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = filteredList.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      items: paginatedItems,
      totalPages,
      currentPage: pageNum,
      totalItems,
      stats
    });
  } catch (err) {
    logger.error(`Error listing blocked IPs: ${err.message}`);
    res.status(500).json({ error: 'Server error retrieving blocked IPs' });
  }
});

// Manually block an IP (with re-activation support)
router.post('/blocked-ips', async (req, res) => {
  try {
    const { ip, reason, expiryHours } = req.body;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required.' });
    }

    const existingBlock = await dbStore.findBlockedIP(ip);
    
    let expiresAt = null;
    if (expiryHours && !isNaN(expiryHours)) {
      expiresAt = new Date(Date.now() + parseFloat(expiryHours) * 60 * 60 * 1000);
    }

    if (existingBlock) {
      if (existingBlock.status === 'Active') {
        return res.status(400).json({ error: 'IP is already blocked.' });
      } else {
        // Re-activate previously inactive block
        existingBlock.status = 'Active';
        existingBlock.blockedAt = new Date();
        existingBlock.reason = reason || 'Manual block by admin';
        existingBlock.expiresAt = expiresAt;
        await existingBlock.save();

        logger.info(`IP ${ip} manually re-activated/blocked by admin ${req.user.email}`);

        await dbStore.createAlert({
          level: 'WARNING',
          title: 'Manual IP Block Re-activated',
          message: `IP address ${ip} was blacklisted again by admin ${req.user.name}. Reason: ${reason || 'None provided'}. Expiration: ${expiresAt ? expiresAt.toLocaleString() : 'Permanent'}`,
        });

        const enriched = await enrichBlockedIP(existingBlock);
        return res.status(200).json(enriched);
      }
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
      message: `IP address ${ip} was manually blacklisted by admin ${req.user.name}. Reason: ${reason || 'None provided'}. Expiration: ${expiresAt ? expiresAt.toLocaleString() : 'Permanent'}`,
    });

    const enriched = await enrichBlockedIP(newBlock);
    res.status(201).json(enriched);
  } catch (err) {
    logger.error(`Error creating manual block: ${err.message}`);
    res.status(500).json({ error: 'Server error creating IP block' });
  }
});

// Manually unblock an IP (status changed to Inactive) via PATCH
router.patch('/blocked-ips/:idOrIp/unblock', async (req, res) => {
  try {
    const { idOrIp } = req.params;

    const result = await dbStore.unblockIP(idOrIp);
    if (!result) {
      return res.status(404).json({ error: 'IP not found in blacklist.' });
    }

    const ip = result.ip;
    logger.info(`IP ${ip} manually unblocked (status changed to Inactive) by admin ${req.user.email}`);

    // Create system alert
    await dbStore.createAlert({
      level: 'INFO',
      title: 'IP Address Unblocked',
      message: `IP address ${ip} was unblocked (whitelisted) by admin ${req.user.name}.`,
    });

    res.status(200).json({ message: `Successfully unblocked IP ${ip}`, block: result });
  } catch (err) {
    logger.error(`Error unblocking IP: ${err.message}`);
    res.status(500).json({ error: 'Server error removing IP block' });
  }
});

// Manually unblock an IP (status changed to Inactive) via DELETE
router.delete('/blocked-ips/:idOrIp', async (req, res) => {
  try {
    const { idOrIp } = req.params;

    const result = await dbStore.unblockIP(idOrIp);
    if (!result) {
      return res.status(404).json({ error: 'IP not found in blacklist.' });
    }

    const ip = result.ip;
    logger.info(`IP ${ip} manually unblocked (status changed to Inactive) by admin ${req.user.email}`);

    // Create system alert
    await dbStore.createAlert({
      level: 'INFO',
      title: 'IP Address Unblocked',
      message: `IP address ${ip} was unblocked (whitelisted) by admin ${req.user.name}.`,
    });

    res.status(200).json({ message: `Successfully unblocked IP ${ip}`, block: result });
  } catch (err) {
    logger.error(`Error unblocking IP: ${err.message}`);
    res.status(500).json({ error: 'Server error removing IP block' });
  }
});

export default router;
