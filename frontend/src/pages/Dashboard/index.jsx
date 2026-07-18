import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  FiShield, 
  FiShieldOff, 
  FiActivity, 
  FiAlertTriangle, 
  FiLock, 
  FiGlobe, 
  FiZap 
} from 'react-icons/fi';
import api from '../../services/api';

const Dashboard = () => {
  const [securityActive, setSecurityActive] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    todayAttacks: 0,
    blockedIPs: 0,
    topIP: 'Loading...',
    topAttackType: 'Loading...',
    criticalAlerts: 0
  });
  const [timeline, setTimeline] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Firewall Security Status
      const statusRes = await api.get('/admin/security-status');
      setSecurityActive(statusRes.data.active);

      // 2. Fetch Aggregated Statistics & Recent Logs
      const statsRes = await api.get('/dashboard/stats');
      setStats(statsRes.data.stats);
      setRecentLogs(statsRes.data.recentLogs);

      // 3. Fetch Timeline Graph Data
      const timelineRes = await api.get('/dashboard/timeline');
      setTimeline(timelineRes.data);
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll stats every 3 seconds for fast live updates
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    setToggleLoading(true);
    try {
      const updatedState = !securityActive;
      const res = await api.post('/admin/security-status', {
        active: updatedState
      });
      setSecurityActive(res.data.active);
      // Refresh stats
      fetchDashboardData();
    } catch (err) {
      console.error('Error toggling firewall shield:', err);
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        <p className="text-cyber-muted font-mono text-sm">Decrypting Security Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Security Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FiActivity className="text-cyan-400" /> WADPS Security Control
          </h1>
          <p className="text-cyber-muted mt-1">Real-time threat monitoring and active filtering console.</p>
        </div>

        {/* Security Shield Filter Toggle */}
        <div className="flex items-center gap-4 bg-cyber-card border border-cyber-border px-5 py-3 rounded-2xl shadow-neon-cyan transition-all">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                securityActive ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                securityActive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              {securityActive ? (
                <>
                  <FiShield className="text-emerald-400" /> Firewall Shield ON
                </>
              ) : (
                <>
                  <FiShieldOff className="text-rose-400 animate-pulse" /> Firewall Shield OFF
                </>
              )}
            </span>
          </div>

          <button
            onClick={handleToggle}
            disabled={toggleLoading}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none border border-cyber-border ${
              securityActive ? 'bg-cyan-500/25 border-cyan-500/50' : 'bg-zinc-800'
            } ${toggleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                securityActive ? 'translate-x-6 bg-cyan-400 shadow-cyan-500/50' : 'translate-x-0 bg-zinc-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Grid Cards Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Requests', value: stats.totalRequests, icon: FiGlobe, color: 'text-blue-400', shadow: 'shadow-none' },
          { title: 'Blocked Requests', value: stats.blockedRequests, icon: FiLock, color: 'text-rose-500', shadow: 'shadow-neon-rose border-rose-500/20' },
          { title: "Today's Attacks", value: stats.todayAttacks, icon: FiAlertTriangle, color: 'text-amber-500', shadow: stats.todayAttacks > 0 ? 'shadow-neon-amber' : 'shadow-none' },
          { title: 'Blocked IPs', value: stats.blockedIPs, icon: FiShield, color: 'text-cyan-400', shadow: 'shadow-none' }
        ].map((item, i) => (
          <div key={i} className={`glass-panel glass-panel-hover p-6 rounded-xl flex items-center justify-between border border-cyber-border ${item.shadow}`}>
            <div>
              <h3 className="text-cyber-muted text-sm font-medium">{item.title}</h3>
              <p className="text-3xl font-semibold text-white mt-2 font-mono">{item.value}</p>
            </div>
            <item.icon className={`w-8 h-8 ${item.color} opacity-80`} />
          </div>
        ))}
      </div>

      {/* Threat Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-cyber-border md:col-span-2 flex flex-col sm:flex-row gap-6 justify-around">
          <div className="flex items-center gap-3">
            <FiZap className="w-8 h-8 text-cyan-400 animate-pulse" />
            <div>
              <h4 className="text-xs uppercase text-cyber-muted tracking-wider">Top Incident Source IP</h4>
              <p className="text-base font-semibold text-white font-mono mt-1">{stats.topIP}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-cyber-border pt-4 sm:pt-0 sm:pl-6">
            <FiShield className="w-8 h-8 text-rose-400" />
            <div>
              <h4 className="text-xs uppercase text-cyber-muted tracking-wider">Primary Attack Vector</h4>
              <p className="text-base font-semibold text-white mt-1 font-mono">{stats.topAttackType}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-cyber-border flex items-center justify-between bg-rose-500/5">
          <div>
            <h4 className="text-xs uppercase text-rose-400 tracking-wider">Active Critical Alerts</h4>
            <p className="text-3xl font-bold text-rose-400 mt-1 font-mono">{stats.criticalAlerts}</p>
          </div>
          <span className="flex h-4 w-4 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
          </span>
        </div>
      </div>

      {/* Charts section */}
      <div className="glass-panel p-6 rounded-xl border border-cyber-border">
        <h3 className="text-lg font-medium text-white mb-4">Traffic and Threats Activity Timeline</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFA3" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00FFA3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12, fontFamily: 'monospace' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: 12, fontFamily: 'monospace' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                labelStyle={{ color: '#00FFA3', fontFamily: 'monospace' }}
                itemStyle={{ color: '#F2F2F2' }}
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
              <Area type="monotone" dataKey="requests" name="Total HTTP Traffic" stroke="#00FFA3" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={2} />
              <Area type="monotone" dataKey="attacks" name="Blocked Threats" stroke="#f43f5e" fillOpacity={1} fill="url(#colorAttacks)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent logs */}
      <div className="glass-panel rounded-xl overflow-hidden border border-cyber-border">
        <div className="p-5 border-b border-cyber-border flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Recent Blocked Attack Vectors</h3>
          <span className="text-xs text-cyber-muted font-mono">Real-time update</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyber-border bg-cyan-950/15 text-xs font-semibold uppercase tracking-wider text-cyber-muted">
                <th className="p-4">Time</th>
                <th className="p-4">Attack Type</th>
                <th className="p-4">Severity</th>
                <th className="p-4">URL</th>
                <th className="p-4 font-mono">Source IP</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border text-sm text-cyber-text">
              {recentLogs.map((log) => (
                <tr key={log._id} className="hover:bg-cyber-card/20 transition">
                  <td className="p-4 whitespace-nowrap text-xs text-cyber-muted">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 whitespace-nowrap font-medium text-white">{log.attackType}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      log.severity === 'HIGH' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate font-mono text-xs text-cyan-400" title={log.url}>
                    {log.method} {log.url}
                  </td>
                  <td className="p-4 whitespace-nowrap font-mono text-xs">{log.ip}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="text-rose-400 font-semibold uppercase text-xs tracking-wider">BLOCKED</span>
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-cyber-muted">No security incidents detected. System is secure.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
