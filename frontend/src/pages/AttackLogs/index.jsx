import React, { useState } from 'react';

const AttackLogs = () => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Sample static logs for presentation purposes
  const dummyLogs = [
    { id: '1', time: '19:25:01', type: 'SQL Injection', severity: 'HIGH', endpoint: '/api/auth/login', payload: "' OR 1=1 --", ip: '192.168.1.15', status: 'BLOCKED' },
    { id: '2', time: '19:25:34', type: 'XSS Attempt', severity: 'HIGH', endpoint: '/api/dashboard', payload: '<script>alert(1)</script>', ip: '203.0.113.50', status: 'BLOCKED' },
    { id: '3', time: '19:26:10', type: 'Rate Limit Warning', severity: 'MEDIUM', endpoint: '/api/auth/register', payload: '100 req/min exceeded', ip: '198.51.100.12', status: 'FLAGGED' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Attack Logs</h1>
        <p className="text-cyber-muted mt-1">Detailed list of blocked and analyzed attack payloads.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-cyber-card border border-cyber-border p-4 rounded-xl">
        <div className="flex gap-2">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === lvl
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-cyber-muted hover:text-white border border-transparent'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by IP or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2 text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cyber-border bg-cyan-950/20 text-xs font-semibold uppercase tracking-wider text-cyber-muted">
              <th className="p-4">Time</th>
              <th className="p-4">Attack Type</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Endpoint</th>
              <th className="p-4">Payload</th>
              <th className="p-4">Source IP</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border text-sm text-cyber-text">
            {dummyLogs.map((log) => (
              <tr key={log.id} className="hover:bg-cyber-card/30 transition">
                <td className="p-4 whitespace-nowrap text-xs text-cyber-muted">{log.time}</td>
                <td className="p-4 whitespace-nowrap font-medium text-white">{log.type}</td>
                <td className="p-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    log.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {log.severity}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap font-mono text-xs text-cyan-400">{log.endpoint}</td>
                <td className="p-4 max-w-xs truncate font-mono text-xs text-cyber-muted" title={log.payload}>{log.payload}</td>
                <td className="p-4 whitespace-nowrap font-mono text-xs">{log.ip}</td>
                <td className="p-4 whitespace-nowrap">
                  <span className="text-emerald-400 font-semibold">{log.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttackLogs;
