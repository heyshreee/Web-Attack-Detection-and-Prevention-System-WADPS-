import React, { useState } from 'react';

const BlockedIPs = () => {
  const [ips, setIps] = useState([
    { ip: '192.168.1.15', reason: 'SQL Injection Payload', blockedAt: '2026-07-03 19:25', expiry: 'Never' },
    { ip: '203.0.113.50', reason: 'Cross-Site Scripting (XSS)', blockedAt: '2026-07-03 19:20', expiry: '24 hours' },
    { ip: '198.51.100.12', reason: 'Brute Force Attempts', blockedAt: '2026-07-03 19:10', expiry: '1 hour' }
  ]);

  const handleUnblock = (ip) => {
    setIps(ips.filter(item => item.ip !== ip));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Blocked IPs</h1>
          <p className="text-cyber-muted mt-1">Manage blacklisted IPs blocked by security middleware.</p>
        </div>
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition">
          + Block Custom IP
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cyber-border bg-cyan-950/20 text-xs font-semibold uppercase tracking-wider text-cyber-muted">
              <th className="p-4">IP Address</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Blocked Time</th>
              <th className="p-4">Expiry</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border text-sm text-cyber-text">
            {ips.map((item) => (
              <tr key={item.ip} className="hover:bg-cyber-card/30 transition">
                <td className="p-4 whitespace-nowrap font-mono text-cyan-400 font-medium">{item.ip}</td>
                <td className="p-4">{item.reason}</td>
                <td className="p-4 text-cyber-muted text-xs">{item.blockedAt}</td>
                <td className="p-4 text-cyber-muted text-xs">{item.expiry}</td>
                <td className="p-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleUnblock(item.ip)}
                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    Unblock IP
                  </button>
                </td>
              </tr>
            ))}
            {ips.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-cyber-muted">No blacklisted IPs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlockedIPs;
