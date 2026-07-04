import { dbStore } from '../services/dbStore.js';

export const getStats = async (req, res) => {
  try {
    const totalRequests = await dbStore.countRequestLogs();
    const blockedRequests = await dbStore.countAttackLogs();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAttacks = await dbStore.countAttackLogs({ timestamp: { $gte: startOfToday } });

    const blockedIPs = await dbStore.countBlockedIPs();

    // Top Attacking IP
    const topIPAgg = await dbStore.getTopIP();
    const topIP = topIPAgg ? topIPAgg._id : 'N/A';
    const topIPCount = topIPAgg ? topIPAgg.count : 0;

    // Top Attack Type
    const topTypeAgg = await dbStore.getTopAttackType();
    const topType = topTypeAgg ? topTypeAgg._id : 'N/A';
    const topTypeCount = topTypeAgg ? topTypeAgg.count : 0;

    // Critical Alerts Active
    const criticalAlerts = await dbStore.countAlerts({ level: 'CRITICAL', read: false });

    // Recent 10 logs
    const recentLogs = await dbStore.findAttackLogs({}, 0, 10);

    res.status(200).json({
      stats: {
        totalRequests,
        blockedRequests,
        todayAttacks,
        blockedIPs,
        topIP: `${topIP} (${topIPCount} attempts)`,
        topAttackType: `${topType} (${topTypeCount} detections)`,
        criticalAlerts,
      },
      recentLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching statistics', details: err.message });
  }
};

export const getTimeline = async (req, res) => {
  try {
    const daysToQuery = 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToQuery + 1);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate Request counts grouped by day
    const requestTimeline = await dbStore.getTimelineRequests(startDate);

    // Aggregate Attack counts grouped by day
    const attackTimeline = await dbStore.getTimelineAttacks(startDate);

    // Format final structure with all last 7 days represented (so no gaps are shown in charts)
    const timelineData = [];
    const requestMap = new Map(requestTimeline.map(item => [item._id, item.count]));
    const attackMap = new Map(attackTimeline.map(item => [item._id, item.count]));

    for (let i = 0; i < daysToQuery; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      timelineData.push({
        date: dateStr,
        requests: requestMap.get(dateStr) || 0,
        attacks: attackMap.get(dateStr) || 0,
      });
    }

    res.status(200).json(timelineData);
  } catch (err) {
    res.status(500).json({ error: 'Server error generating timeline data', details: err.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const daysToQuery = 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToQuery + 1);
    startDate.setHours(0, 0, 0, 0);

    // 1. Timeline
    const requestTimeline = await dbStore.getTimelineRequests(startDate);
    const attackTimeline = await dbStore.getTimelineAttacks(startDate);
    const timelineData = [];
    const requestMap = new Map(requestTimeline.map(item => [item._id, item.count]));
    const attackMap = new Map(attackTimeline.map(item => [item._id, item.count]));

    for (let i = 0; i < daysToQuery; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      timelineData.push({
        date: dateStr,
        requests: requestMap.get(dateStr) || 0,
        attacks: attackMap.get(dateStr) || 0,
      });
    }

    // 2. Attack Type Distribution
    const attackTypes = await dbStore.getAttackTypeDistribution();

    // 3. Attack Severity Distribution
    const attackSeverities = await dbStore.getAttackSeverityDistribution();

    // 4. Top IPs
    const topIPs = await dbStore.getTopIPs();

    // 5. Top Endpoints
    const topEndpoints = await dbStore.getTopEndpoints();

    res.status(200).json({
      timeline: timelineData,
      attackTypes,
      attackSeverities,
      topIPs,
      topEndpoints
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error generating analytics data', details: err.message });
  }
};
