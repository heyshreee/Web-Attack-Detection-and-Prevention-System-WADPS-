import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import BlockedIP from '../models/BlockedIP.js';
import AttackLog from '../models/AttackLog.js';
import Alert from '../models/Alert.js';
import RequestLog from '../models/RequestLog.js';

const generateMockData = () => {
  const users = [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Agent Smith',
      email: 'admin@wadps.local',
      password: bcrypt.hashSync('password', 10),
      role: 'admin',
      createdAt: new Date()
    }
  ];
  
  const loginHistory = [];
  const blockedIPs = [];
  const attackLogs = [];
  const alerts = [];
  const requestLogs = [];

  const now = new Date();
  const attackTypes = ['SQL Injection', 'XSS Attempt', 'Path Traversal', 'Command Injection'];
  const severities = ['HIGH', 'MEDIUM', 'CRITICAL', 'LOW'];
  const ips = ['192.168.1.10', '10.0.0.4', '172.16.0.22', '192.168.1.45', '8.8.8.8'];
  const urls = ['/api/products', '/api/users/login', '/api/checkout', '/api/settings', '/api/dashboard'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Daily Requests (100 to 250 requests)
    const dailyRequests = Math.floor(Math.random() * 150) + 100;
    for (let r = 0; r < dailyRequests; r++) {
      const logTime = new Date(date);
      logTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      requestLogs.push({
        ip: ips[Math.floor(Math.random() * ips.length)],
        method: Math.random() > 0.3 ? 'GET' : 'POST',
        url: urls[Math.floor(Math.random() * urls.length)],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        statusCode: Math.random() > 0.05 ? 200 : 400,
        duration: Math.floor(Math.random() * 150) + 10,
        timestamp: logTime
      });
    }

    // Daily Attacks (2 to 8 attacks)
    const dailyAttacks = Math.floor(Math.random() * 7) + 2;
    for (let a = 0; a < dailyAttacks; a++) {
      const logTime = new Date(date);
      logTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      const newAttackId = new mongoose.Types.ObjectId();
      attackLogs.push({
        _id: newAttackId,
        attackType,
        severity,
        payload: attackType === 'SQL Injection' ? 'UNION SELECT username, password' : '<script>alert(1)</script>',
        url: urls[Math.floor(Math.random() * urls.length)],
        method: 'GET',
        ip: ips[Math.floor(Math.random() * ips.length)],
        timestamp: logTime
      });

      if (severity === 'CRITICAL' || severity === 'HIGH') {
        alerts.push({
          _id: new mongoose.Types.ObjectId(),
          level: severity,
          title: `Critical Alert: ${attackType}`,
          message: `Suspected malicious intrusion pattern triggered on endpoint. Originating IP: ${ips[Math.floor(Math.random() * ips.length)]}`,
          read: Math.random() > 0.5,
          timestamp: logTime
        });
      }
    }
  }

  return { users, loginHistory, blockedIPs, attackLogs, alerts, requestLogs };
};

const generatedMock = generateMockData();

// In-Memory Fallback Collections
export const inMemory = {
  users: generatedMock.users,
  loginHistory: generatedMock.loginHistory,
  blockedIPs: generatedMock.blockedIPs,
  attackLogs: generatedMock.attackLogs,
  alerts: generatedMock.alerts,
  requestLogs: generatedMock.requestLogs
};

// Check if mongoose is connected
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Helper methods that fallback automatically
export const dbStore = {
  // Users
  findUserByEmail: async (email) => {
    if (isDbConnected()) {
      try {
        return await User.findOne({ email });
      } catch (err) {
        // Fallback if call fails due to buffering error
      }
    }
    return inMemory.users.find(u => u.email === email.toLowerCase()) || null;
  },
  findUserById: async (id) => {
    if (isDbConnected()) {
      try {
        return await User.findById(id).select('-password');
      } catch (err) {
        // Fallback
      }
    }
    const user = inMemory.users.find(u => String(u._id) === String(id));
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },
  createUser: async (userData) => {
    if (isDbConnected()) {
      try {
        const user = new User(userData);
        return await user.save();
      } catch (err) {
        // Fallback
      }
    }
    const newUser = {
      _id: new mongoose.Types.ObjectId(),
      ...userData,
      createdAt: new Date()
    };
    inMemory.users.push(newUser);
    return newUser;
  },

  // BlockedIPs
  findBlockedIP: async (ip) => {
    if (isDbConnected()) {
      try {
        return await BlockedIP.findOne({ ip });
      } catch (err) {
        // Fallback
      }
    }
    return inMemory.blockedIPs.find(b => b.ip === ip) || null;
  },
  deleteBlockedIP: async (ip) => {
    if (isDbConnected()) {
      try {
        return await BlockedIP.deleteOne({ ip });
      } catch (err) {
        // Fallback
      }
    }
    const initialLength = inMemory.blockedIPs.length;
    inMemory.blockedIPs = inMemory.blockedIPs.filter(b => b.ip !== ip);
    return { deletedCount: initialLength - inMemory.blockedIPs.length };
  },
  createBlockedIP: async (blockData) => {
    if (isDbConnected()) {
      try {
        const block = new BlockedIP(blockData);
        return await block.save();
      } catch (err) {
        // Fallback
      }
    }
    const newBlock = {
      _id: new mongoose.Types.ObjectId(),
      ip: blockData.ip,
      reason: blockData.reason || 'Manual block by admin',
      blockedAt: new Date(),
      expiresAt: blockData.expiresAt || null,
      status: blockData.status || 'Active'
    };
    inMemory.blockedIPs.push(newBlock);
    return newBlock;
  },
  unblockIP: async (ipOrId) => {
    if (isDbConnected()) {
      try {
        const query = mongoose.Types.ObjectId.isValid(ipOrId)
          ? { _id: ipOrId }
          : { ip: ipOrId };
        return await BlockedIP.findOneAndUpdate(query, { status: 'Inactive' }, { new: true });
      } catch (err) {
        // Fallback
      }
    }
    const record = inMemory.blockedIPs.find(b => String(b._id) === String(ipOrId) || b.ip === ipOrId);
    if (record) {
      record.status = 'Inactive';
      return record;
    }
    return null;
  },
  listBlockedIPs: async () => {
    if (isDbConnected()) {
      try {
        return await BlockedIP.find().sort({ blockedAt: -1 });
      } catch (err) {
        // Fallback
      }
    }
    return [...inMemory.blockedIPs].sort((a, b) => b.blockedAt - a.blockedAt);
  },
  countBlockedIPs: async () => {
    if (isDbConnected()) {
      try {
        return await BlockedIP.countDocuments();
      } catch (err) {
        // Fallback
      }
    }
    return inMemory.blockedIPs.length;
  },

  // LoginHistory
  createLoginHistory: async (historyData) => {
    if (isDbConnected()) {
      try {
        const history = new LoginHistory(historyData);
        return await history.save();
      } catch (err) {
        // Fallback
      }
    }
    const newHistory = {
      _id: new mongoose.Types.ObjectId(),
      ...historyData,
      timestamp: new Date()
    };
    inMemory.loginHistory.push(newHistory);
    return newHistory;
  },
  countFailedLogins: async (ip, sinceDate) => {
    if (isDbConnected()) {
      try {
        return await LoginHistory.countDocuments({
          ip,
          success: false,
          timestamp: { $gte: sinceDate }
        });
      } catch (err) {
        // Fallback
      }
    }
    return inMemory.loginHistory.filter(h => 
      h.ip === ip && 
      !h.success && 
      h.timestamp >= sinceDate
    ).length;
  },

  // AttackLogs
  createAttackLog: async (logData) => {
    if (isDbConnected()) {
      try {
        const log = new AttackLog(logData);
        return await log.save();
      } catch (err) {
        // Fallback
      }
    }
    const newLog = {
      _id: new mongoose.Types.ObjectId(),
      ...logData,
      timestamp: new Date()
    };
    inMemory.attackLogs.push(newLog);
    // Prune log overflow
    if (inMemory.attackLogs.length > 500) inMemory.attackLogs.shift();
    return newLog;
  },
  countAttackLogs: async (filter = {}) => {
    if (isDbConnected()) {
      try {
        return await AttackLog.countDocuments(filter);
      } catch (err) {
        // Fallback
      }
    }
    return dbStore.filterAttackLogsMemory(filter).length;
  },
  findAttackLogs: async (filter = {}, skip = 0, limit = 10) => {
    if (isDbConnected()) {
      try {
        return await AttackLog.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit);
      } catch (err) {
        // Fallback
      }
    }
    const filtered = dbStore.filterAttackLogsMemory(filter);
    return filtered
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);
  },
  filterAttackLogsMemory: (filter) => {
    return inMemory.attackLogs.filter(log => {
      if (filter.severity && filter.severity !== 'ALL' && log.severity !== filter.severity) return false;
      if (filter.attackType && filter.attackType !== 'ALL' && log.attackType !== filter.attackType) return false;
      if (filter.ip && log.ip !== filter.ip) return false;
      if (filter.timestamp) {
        if (filter.timestamp.$gte && log.timestamp < filter.timestamp.$gte) return false;
        if (filter.timestamp.$lte && log.timestamp > filter.timestamp.$lte) return false;
      }
      if (filter.$or) {
        // search filter
        const match = filter.$or.some(cond => {
          const key = Object.keys(cond)[0];
          const queryVal = cond[key].$regex.source || cond[key].$regex;
          const targetVal = String(log[key] || '');
          return new RegExp(queryVal, 'i').test(targetVal);
        });
        if (!match) return false;
      }
      return true;
    });
  },

  // Alerts
  createAlert: async (alertData) => {
    if (isDbConnected()) {
      try {
        const alert = new Alert(alertData);
        return await alert.save();
      } catch (err) {
        // Fallback
      }
    }
    const newAlert = {
      _id: new mongoose.Types.ObjectId(),
      level: alertData.level || 'INFO',
      title: alertData.title,
      message: alertData.message,
      read: false,
      timestamp: new Date()
    };
    inMemory.alerts.push(newAlert);
    if (inMemory.alerts.length > 500) inMemory.alerts.shift();
    return newAlert;
  },
  countAlerts: async (filter = {}) => {
    if (isDbConnected()) {
      try {
        return await Alert.countDocuments(filter);
      } catch (err) {
        // Fallback
      }
    }
    return inMemory.alerts.filter(a => {
      if (filter.level && a.level !== filter.level) return false;
      if (filter.read !== undefined && a.read !== filter.read) return false;
      return true;
    }).length;
  },
  findAlerts: async (filter = {}, skip = 0, limit = 20) => {
    if (isDbConnected()) {
      try {
        return await Alert.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit);
      } catch (err) {
        // Fallback
      }
    }
    const filtered = inMemory.alerts.filter(a => {
      if (filter.level && a.level !== filter.level) return false;
      if (filter.read !== undefined && a.read !== filter.read) return false;
      return true;
    });
    return filtered
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);
  },
  updateAlertRead: async (id) => {
    if (isDbConnected()) {
      try {
        return await Alert.findByIdAndUpdate(id, { read: true }, { new: true });
      } catch (err) {
        // Fallback
      }
    }
    const alert = inMemory.alerts.find(a => String(a._id) === String(id));
    if (alert) {
      alert.read = true;
      return alert;
    }
    return null;
  },
  markAllAlertsRead: async () => {
    if (isDbConnected()) {
      try {
        return await Alert.updateMany({ read: false }, { read: true });
      } catch (err) {
        // Fallback
      }
    }
    inMemory.alerts.forEach(a => { a.read = true; });
    return { modifiedCount: inMemory.alerts.length };
  },

  // RequestLogs
  createRequestLog: async (logData) => {
    if (isDbConnected()) {
      try {
        const log = new RequestLog(logData);
        return await log.save();
      } catch (err) {
        // Fallback
      }
    }
    const newLog = {
      _id: new mongoose.Types.ObjectId(),
      ...logData,
      timestamp: new Date()
    };
    inMemory.requestLogs.push(newLog);
    if (inMemory.requestLogs.length > 1000) inMemory.requestLogs.shift();
    return newLog;
  },
  countRequestLogs: async (filter = {}) => {
    if (isDbConnected()) {
      try {
        return await RequestLog.countDocuments(filter);
      } catch (err) {
        // Fallback
      }
    }
    return dbStore.filterRequestLogsMemory(filter).length;
  },
  findRequestLogs: async (filter = {}, skip = 0, limit = 10) => {
    if (isDbConnected()) {
      try {
        return await RequestLog.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit);
      } catch (err) {
        // Fallback
      }
    }
    const filtered = dbStore.filterRequestLogsMemory(filter);
    return filtered
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);
  },
  filterRequestLogsMemory: (filter) => {
    return inMemory.requestLogs.filter(log => {
      if (filter.statusCode && log.statusCode !== filter.statusCode) return false;
      if (filter.method && filter.method !== 'ALL' && log.method !== filter.method) return false;
      if (filter.timestamp) {
        if (filter.timestamp.$gte && log.timestamp < filter.timestamp.$gte) return false;
      }
      if (filter.$or) {
        const match = filter.$or.some(cond => {
          const key = Object.keys(cond)[0];
          const queryVal = cond[key].$regex.source || cond[key].$regex;
          const targetVal = String(log[key] || '');
          return new RegExp(queryVal, 'i').test(targetVal);
        });
        if (!match) return false;
      }
      return true;
    });
  },

  // Aggregate Stats
  getTopIP: async () => {
    if (isDbConnected()) {
      try {
        const topIPAgg = await AttackLog.aggregate([
          { $group: { _id: '$ip', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]);
        return topIPAgg.length > 0 ? topIPAgg[0] : null;
      } catch (err) {
        // Fallback
      }
    }
    const ipCounts = {};
    inMemory.attackLogs.forEach(log => {
      ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
    });
    const sorted = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { _id: sorted[0][0], count: sorted[0][1] } : null;
  },
  getTopAttackType: async () => {
    if (isDbConnected()) {
      try {
        const topTypeAgg = await AttackLog.aggregate([
          { $group: { _id: '$attackType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]);
        return topTypeAgg.length > 0 ? topTypeAgg[0] : null;
      } catch (err) {
        // Fallback
      }
    }
    const typeCounts = {};
    inMemory.attackLogs.forEach(log => {
      typeCounts[log.attackType] = (typeCounts[log.attackType] || 0) + 1;
    });
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { _id: sorted[0][0], count: sorted[0][1] } : null;
  },

  // Timeline queries
  getTimelineRequests: async (startDate) => {
    if (isDbConnected()) {
      try {
        return await RequestLog.aggregate([
          { $match: { timestamp: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              count: { $sum: 1 }
            }
          }
        ]);
      } catch (err) {
        // Fallback
      }
    }
    const countsByDate = {};
    inMemory.requestLogs.forEach(log => {
      if (log.timestamp >= startDate) {
        const dateStr = log.timestamp.toISOString().split('T')[0];
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      }
    });
    return Object.entries(countsByDate).map(([dateStr, count]) => ({ _id: dateStr, count }));
  },
  getTimelineAttacks: async (startDate) => {
    if (isDbConnected()) {
      try {
        return await AttackLog.aggregate([
          { $match: { timestamp: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              count: { $sum: 1 }
            }
          }
        ]);
      } catch (err) {
        // Fallback
      }
    }
    const countsByDate = {};
    inMemory.attackLogs.forEach(log => {
      if (log.timestamp >= startDate) {
        const dateStr = log.timestamp.toISOString().split('T')[0];
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      }
    });
    return Object.entries(countsByDate).map(([dateStr, count]) => ({ _id: dateStr, count }));
  },
  deleteAttackLog: async (id) => {
    if (isDbConnected()) {
      try {
        return await AttackLog.findByIdAndDelete(id);
      } catch (err) {
        // Fallback
      }
    }
    const initialLength = inMemory.attackLogs.length;
    inMemory.attackLogs = inMemory.attackLogs.filter(a => String(a._id) !== String(id));
    return { deletedCount: initialLength - inMemory.attackLogs.length };
  },
  deleteAlert: async (id) => {
    if (isDbConnected()) {
      try {
        return await Alert.findByIdAndDelete(id);
      } catch (err) {
        // Fallback
      }
    }
    const initialLength = inMemory.alerts.length;
    inMemory.alerts = inMemory.alerts.filter(a => String(a._id) !== String(id));
    return { deletedCount: initialLength - inMemory.alerts.length };
  },
  getAttackTypeDistribution: async () => {
    if (isDbConnected()) {
      try {
        return await AttackLog.aggregate([
          { $group: { _id: '$attackType', count: { $sum: 1 } } }
        ]);
      } catch (err) {
        // Fallback
      }
    }
    const counts = {};
    inMemory.attackLogs.forEach(l => { counts[l.attackType] = (counts[l.attackType] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ _id: type, count }));
  },
  getAttackSeverityDistribution: async () => {
    if (isDbConnected()) {
      try {
        return await AttackLog.aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);
      } catch (err) {
        // Fallback
      }
    }
    const counts = {};
    inMemory.attackLogs.forEach(l => { counts[l.severity] = (counts[l.severity] || 0) + 1; });
    return Object.entries(counts).map(([sev, count]) => ({ _id: sev, count }));
  },
  getTopIPs: async () => {
    if (isDbConnected()) {
      try {
        return await AttackLog.aggregate([
          { $group: { _id: '$ip', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]);
      } catch (err) {
        // Fallback
      }
    }
    const counts = {};
    inMemory.attackLogs.forEach(l => { counts[l.ip] = (counts[l.ip] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ _id: ip, count }));
  },
  getTopEndpoints: async () => {
    if (isDbConnected()) {
      try {
        return await AttackLog.aggregate([
          { $group: { _id: '$url', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]);
      } catch (err) {
        // Fallback
      }
    }
    const counts = {};
    inMemory.attackLogs.forEach(l => { counts[l.url] = (counts[l.url] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ _id: url, count }));
  }
};
