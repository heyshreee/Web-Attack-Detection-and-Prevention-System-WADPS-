import { dbStore } from '../services/dbStore.js';

export const getAttackLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.severity && req.query.severity !== 'ALL') {
      filter.severity = req.query.severity;
    }
    if (req.query.attackType && req.query.attackType !== 'ALL') {
      filter.attackType = req.query.attackType;
    }
    if (req.query.ip) {
      filter.ip = req.query.ip;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { ip: searchRegex },
        { attackType: searchRegex },
        { payload: searchRegex },
        { url: searchRegex }
      ];
    }

    const total = await dbStore.countAttackLogs(filter);
    const logs = await dbStore.findAttackLogs(filter, skip, limit);

    res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching attack logs', details: err.message });
  }
};

export const getRequestLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.statusCode) {
      filter.statusCode = parseInt(req.query.statusCode);
    }
    if (req.query.method && req.query.method !== 'ALL') {
      filter.method = req.query.method;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { ip: searchRegex },
        { url: searchRegex }
      ];
    }

    const total = await dbStore.countRequestLogs(filter);
    const logs = await dbStore.findRequestLogs(filter, skip, limit);

    res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching request logs', details: err.message });
  }
};

export const exportLogs = async (req, res) => {
  try {
    const type = req.query.type || 'attack'; // 'attack' or 'request'
    const format = req.query.format || 'json'; // 'csv' or 'json'
    const limit = parseInt(req.query.limit) || 2000;

    if (type === 'attack') {
      const logs = await dbStore.findAttackLogs({}, 0, limit);
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="attack_logs_${Date.now()}.json"`);
        return res.status(200).json(logs);
      } else {
        // CSV Format
        let csv = 'Timestamp,IP,Attack Type,Severity,URL,Method,Payload\n';
        for (const log of logs) {
          const cleanPayload = (log.payload || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
          csv += `"${new Date(log.timestamp).toISOString()}","${log.ip}","${log.attackType}","${log.severity}","${log.url}","${log.method}","${cleanPayload}"\n`;
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attack_logs_${Date.now()}.csv"`);
        return res.status(200).send(csv);
      }
    } else {
      // Request Logs
      const logs = await dbStore.findRequestLogs({}, 0, limit);

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="request_logs_${Date.now()}.json"`);
        return res.status(200).json(logs);
      } else {
        // CSV Format
        let csv = 'Timestamp,IP,Method,URL,StatusCode,Duration(ms)\n';
        for (const log of logs) {
          csv += `"${new Date(log.timestamp).toISOString()}","${log.ip}","${log.method}","${log.url}",${log.statusCode},${log.duration}\n`;
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="request_logs_${Date.now()}.csv"`);
        return res.status(200).send(csv);
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error exporting logs', details: err.message });
  }
};

export const deleteLog = async (req, res) => {
  try {
    const result = await dbStore.deleteAttackLog(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.status(200).json({ message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting log', details: err.message });
  }
};
