import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiLock, FiUnlock, FiPlus } from 'react-icons/fi';
import api from '../../services/api';

const BlockedIPs = () => {
  const navigate = useNavigate();
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customIp, setCustomIp] = useState('');
  const [reason, setReason] = useState('');
  const [expiryHours, setExpiryHours] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBlockedIPs = async () => {
    try {
      const res = await api.get('/admin/blocked-ips');
      setIps(res.data);
    } catch (err) {
      console.error('Error fetching blocked IPs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  const handleUnblock = async (ip) => {
    if (!window.confirm(`Are you sure you want to whitelist and unblock IP ${ip}?`)) {
      return;
    }
    try {
      await api.delete(`/admin/blocked-ips/${ip}`);
      setIps(ips.filter((item) => item.ip !== ip));
    } catch (err) {
      console.error('Error unblocking IP:', err);
      alert('Failed to unblock IP address.');
    }
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/blocked-ips', {
        ip: customIp,
        reason,
        expiryHours: expiryHours ? parseFloat(expiryHours) : null
      });
      
      setIps([res.data, ...ips]);
      
      setCustomIp('');
      setReason('');
      setExpiryHours('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error blocking IP:', err);
      const errMsg = err.response?.data?.error || 'Failed to blacklist IP.';
      setError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FiShield className="text-cyan-400" /> Blacklisted IPs
          </h1>
          <p className="text-cyber-muted mt-1">Manage network access blocks and manual IP overrides.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/25"
        >
          <FiPlus /> Block Custom IP
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="text-cyber-muted font-mono text-sm">Loading blacklisted IPs...</span>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-cyber-border">
          <div className="overflow-x-auto">
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
                    <td className="p-4 text-cyber-muted text-xs">
                      {new Date(item.blockedAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-cyber-muted text-xs">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'Permanent Block'}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/attack-logs?ip=${item.ip}`)}
                        className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center transition"
                      >
                        View Logs
                      </button>
                      <button
                        onClick={() => handleUnblock(item.ip)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <FiUnlock className="w-3.5 h-3.5" /> Unblock
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
      )}

      {/* Block Custom IP Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-cyber-card border border-cyber-border p-6 rounded-2xl shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FiLock className="text-rose-400" /> Blacklist Custom IP Address
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyber-muted mb-1.5">IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.100"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2 text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyber-muted mb-1.5">Block Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manual operator block for suspicious traffic"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2 text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyber-muted mb-1.5">Block Duration (Hours)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 24 (Leave blank for permanent block)"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2 text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500 text-sm transition"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-sm font-medium text-cyber-muted hover:text-white rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-rose-600/25 disabled:opacity-50"
                >
                  {actionLoading ? 'Locking IP...' : 'Lock Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedIPs;
