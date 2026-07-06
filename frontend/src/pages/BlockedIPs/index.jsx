import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiShield, FiLock, FiUnlock, FiPlus, FiSearch, 
  FiInfo, FiX, FiDownload, FiActivity, FiGlobe, FiTarget, 
  FiAlertTriangle, FiClock, FiCalendar, FiRefreshCw, 
  FiChevronLeft, FiChevronRight 
} from 'react-icons/fi';
import api from '../../services/api';

const BlockedIPs = () => {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [sortKey, setSortKey] = useState('latest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Stats Card
  const [stats, setStats] = useState({
    totalBlocked: 0,
    activeCount: 0,
    inactiveCount: 0,
    topCountry: 'N/A',
    topAttack: 'N/A',
    avgDuration: 'N/A'
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customIp, setCustomIp] = useState('');
  const [reason, setReason] = useState('');
  const [expiryHours, setExpiryHours] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Attacker Detail Modal State
  const [selectedIp, setSelectedIp] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchBlockedIPs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await api.get('/admin/blocked-ips', {
        params: {
          search: searchTerm,
          status: statusFilter,
          reason: reasonFilter,
          severity: severityFilter,
          sort: sortKey,
          page,
          limit: pageSize
        }
      });
      setIps(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.totalItems || 0);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching blocked IPs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm, statusFilter, reasonFilter, severityFilter, sortKey, page, pageSize]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, reasonFilter, severityFilter, sortKey, pageSize]);

  // Load and refresh
  useEffect(() => {
    fetchBlockedIPs(true);
  }, [fetchBlockedIPs]);

  // Set 5-second polling interval
  useEffect(() => {
    const timer = setInterval(() => {
      fetchBlockedIPs(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchBlockedIPs]);

  const handleUnblock = async (idOrIp) => {
    if (!window.confirm(`Are you sure you want to whitelist and unblock IP ${idOrIp}?`)) {
      return;
    }
    try {
      await api.patch(`/admin/blocked-ips/${idOrIp}/unblock`);
      fetchBlockedIPs(false);
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
      await api.post('/admin/blocked-ips', {
        ip: customIp,
        reason,
        expiryHours: expiryHours ? parseFloat(expiryHours) : null
      });
      
      setCustomIp('');
      setReason('');
      setExpiryHours('');
      setIsModalOpen(false);
      fetchBlockedIPs(true);
    } catch (err) {
      console.error('Error blocking IP:', err);
      const errMsg = err.response?.data?.error || 'Failed to blacklist IP.';
      setError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/admin/blocked-ips', {
        params: {
          search: searchTerm,
          status: statusFilter,
          reason: reasonFilter,
          severity: severityFilter,
          sort: sortKey,
          page: 1,
          limit: 10000
        }
      });
      
      const itemsToExport = res.data.items || [];
      if (itemsToExport.length === 0) {
        alert('No records available to export.');
        return;
      }

      const headers = ['IP Address', 'Country', 'Reason', 'Severity', 'Threat Score', 'Blocked At', 'Expires At', 'Status', 'Blocked By', 'Attack Count', 'Requests Count', 'Target Endpoint'];
      const rows = itemsToExport.map(item => [
        item.ip,
        item.country || 'Unknown',
        item.reason || 'N/A',
        item.severity || 'Low',
        item.threatScore || 0,
        item.blockedAt ? new Date(item.blockedAt).toISOString() : 'N/A',
        item.expiresAt ? new Date(item.expiresAt).toISOString() : 'Permanent',
        item.status || 'Active',
        item.blockedBy || 'Automatic',
        item.attackCount || 0,
        item.requests || 0,
        item.targetEndpoint || '/api'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `WADPS_Blocked_IPs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export CSV.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await api.get('/admin/blocked-ips', {
        params: {
          search: searchTerm,
          status: statusFilter,
          reason: reasonFilter,
          severity: severityFilter,
          sort: sortKey,
          page: 1,
          limit: 10000
        }
      });
      
      const itemsToExport = res.data.items || [];
      if (itemsToExport.length === 0) {
        alert('No records available to export.');
        return;
      }

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>WADPS Blocked IPs - Threat Intelligence Report</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; color: #1e293b; padding: 35px; margin: 0; }
              h1 { color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 5px; font-size: 22px; font-weight: 700; }
              .subtitle { font-size: 12px; color: #64748b; margin-bottom: 25px; font-family: monospace; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
              th { background-color: #f8fafc; color: #475569; text-align: left; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
              td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; text-align: center; }
              .badge-critical { background-color: #fee2e2; color: #991b1b; }
              .badge-high { background-color: #ffedd5; color: #9a3412; }
              .badge-medium { background-color: #fef9c3; color: #854d0e; }
              .badge-low { background-color: #dcfce7; color: #166534; }
              .badge-active { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
              .badge-inactive { background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
              .threat-cell { font-weight: 700; text-align: right; font-family: monospace; font-size: 12px; }
              .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <h1>WADPS Threat Intelligence Report</h1>
            <div class="subtitle">Generated on: ${new Date().toLocaleString()} | Filters: Search='${searchTerm || 'None'}', Status='${statusFilter}', Reason='${reasonFilter}', Severity='${severityFilter}'</div>
            <table>
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Country</th>
                  <th>Reason</th>
                  <th>Severity</th>
                  <th>Threat Score</th>
                  <th>Blocked At</th>
                  <th>Expires At</th>
                  <th>Status</th>
                  <th>Blocked By</th>
                </tr>
              </thead>
              <tbody>
                ${itemsToExport.map(item => `
                  <tr>
                    <td style="font-family: monospace; font-weight: 700; color: #0f172a; font-size: 12px;">${item.ip}</td>
                    <td>${item.country || 'Unknown'}</td>
                    <td>${item.reason || 'N/A'}</td>
                    <td><span class="badge badge-${(item.severity || 'low').toLowerCase()}">${item.severity}</span></td>
                    <td class="threat-cell">${item.threatScore}</td>
                    <td>${item.blockedAt ? new Date(item.blockedAt).toLocaleString() : 'N/A'}</td>
                    <td>${item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'Permanent'}</td>
                    <td><span class="badge badge-${(item.status || 'Active').toLowerCase()}">${item.status}</span></td>
                    <td>${item.blockedBy || 'Automatic'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">Web Attack Detection and Prevention System (WADPS) &copy; ${new Date().getFullYear()} - Threat Intelligence and Mitigation System.</div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF.');
    }
  };

  const handleOpenDetails = (item) => {
    setSelectedIp(item);
    setIsDetailsModalOpen(true);
  };

  // Color coding rules for Threat Score
  const getThreatScoreColorClass = (score) => {
    if (score >= 81) return 'text-rose-500 border-rose-500/30 bg-rose-500/10 shadow-neon-danger';
    if (score >= 61) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    if (score >= 31) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FiShield className="text-cyan-400 animate-pulse" /> Blocked IPs & Attackers
          </h1>
          <p className="text-cyber-muted mt-1">SOC intelligence management center for blacklists, active blocks, and threat remediation.</p>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing && (
            <span className="flex items-center gap-1 text-xs text-cyan-400 font-mono">
              <FiRefreshCw className="animate-spin" /> Live Updating...
            </span>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/25"
          >
            <FiPlus /> Block Custom IP
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-cyber-border flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <FiShield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{stats.totalBlocked}</div>
            <div className="text-xs text-cyber-muted font-medium uppercase tracking-wider">Total Block Records</div>
          </div>
          <div className="absolute top-2 right-3 flex items-center gap-1.5">
            <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold px-1.5 py-0.5 rounded-md">{stats.activeCount} Active</span>
            <span className="text-[10px] bg-zinc-800 text-cyber-muted font-bold px-1.5 py-0.5 rounded-md">{stats.inactiveCount} History</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyber-border flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
            <FiGlobe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white max-w-[180px] truncate">{stats.topCountry}</div>
            <div className="text-xs text-cyber-muted font-medium uppercase tracking-wider">Top Attacker Country</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyber-border flex items-center gap-4">
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl">
            <FiTarget className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white max-w-[180px] truncate">{stats.topAttack}</div>
            <div className="text-xs text-cyber-muted font-medium uppercase tracking-wider">Top Attack Category</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyber-border flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{stats.avgDuration}</div>
            <div className="text-xs text-cyber-muted font-medium uppercase tracking-wider">Avg Temp Ban Duration</div>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-cyber-border grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="relative md:col-span-3">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search IP or Country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cyber-bg border border-cyber-border focus:border-cyan-500 focus:outline-none rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-cyber-muted transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 md:col-span-2">
          <span className="text-xs text-cyber-muted whitespace-nowrap font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-cyber-bg border border-cyber-border focus:border-cyan-500 focus:outline-none rounded-xl px-2.5 py-2 text-xs text-white transition"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Reason Filter */}
        <div className="flex items-center gap-1.5 md:col-span-2.5">
          <span className="text-xs text-cyber-muted whitespace-nowrap font-medium">Attack:</span>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full bg-cyber-bg border border-cyber-border focus:border-cyan-500 focus:outline-none rounded-xl px-2.5 py-2 text-xs text-white transition"
          >
            <option value="All">All Attacks</option>
            <option value="SQL Injection">SQL Injection</option>
            <option value="XSS">XSS Attempt</option>
            <option value="Brute Force">Brute Force</option>
            <option value="Rate Limit">Rate Limit</option>
            <option value="Manual">Manual Block</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 md:col-span-2">
          <span className="text-xs text-cyber-muted whitespace-nowrap font-medium">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-cyber-bg border border-cyber-border focus:border-cyan-500 focus:outline-none rounded-xl px-2.5 py-2 text-xs text-white transition"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-1.5 md:col-span-2.5">
          <span className="text-xs text-cyber-muted whitespace-nowrap font-medium">Sort:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="w-full bg-cyber-bg border border-cyber-border focus:border-cyan-500 focus:outline-none rounded-xl px-2.5 py-2 text-xs text-white transition"
          >
            <option value="latest">Latest Blocks</option>
            <option value="oldest">Oldest Blocks</option>
            <option value="severity">Risk Level (Threat Score)</option>
            <option value="country">Country</option>
          </select>
        </div>
      </div>

      {/* Export & Actions Info Panel */}
      <div className="flex items-center justify-between text-xs text-cyber-muted px-1">
        <div>
          Showing <span className="text-cyan-400 font-mono font-bold">{ips.length}</span> of <span className="text-white font-mono font-bold">{totalItems}</span> matching attackers.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-cyber-card border border-cyber-border hover:border-cyan-500 hover:text-white rounded-lg flex items-center gap-1 transition"
          >
            <FiDownload className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-cyber-card border border-cyber-border hover:border-cyan-500 hover:text-white rounded-lg flex items-center gap-1 transition"
          >
            <FiDownload className="w-3.5 h-3.5" /> PDF Report
          </button>
        </div>
      </div>

      {/* Main Database Table Panel */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 glass-panel rounded-2xl border border-cyber-border">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-cyan-500"></div>
          <span className="text-cyber-muted font-mono text-sm">Loading security database...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl overflow-hidden border border-cyber-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyan-950/20 text-xs font-semibold uppercase tracking-wider text-cyber-muted">
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Country</th>
                    <th className="p-4">Reason / Attack Vector</th>
                    <th className="p-4 text-center">Threat Score</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">Blocked At</th>
                    <th className="p-4">Expires</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border text-sm text-cyber-text">
                  {ips.map((item) => (
                    <tr key={item._id || item.ip} className="hover:bg-cyber-card/30 transition">
                      <td className="p-4 whitespace-nowrap font-mono text-cyan-400 font-medium">
                        {item.ip}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                          {item.country || 'Localhost'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap font-medium text-white max-w-[200px] truncate">
                        {item.reason}
                      </td>
                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border font-mono ${getThreatScoreColorClass(item.threatScore)}`}>
                          {item.threatScore}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-center">
                        {item.status === 'Active' ? (
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold rounded-md shadow-neon-danger inline-flex items-center gap-1">
                            <span className="w-1 h-1 bg-rose-500 rounded-full animate-ping"></span>
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-cyber-muted text-xs font-bold rounded-md inline-flex items-center gap-1">
                            Whitelist
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-cyber-muted text-xs whitespace-nowrap">
                        {item.blockedAt ? new Date(item.blockedAt).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="p-4 text-cyber-muted text-xs whitespace-nowrap">
                        {item.expiresAt ? new Date(item.expiresAt).toLocaleTimeString() : 'Permanent'}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(item)}
                          className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <FiInfo className="w-3.5 h-3.5" /> Details
                        </button>
                        {item.status === 'Active' && (
                          <button
                            onClick={() => handleUnblock(item.ip)}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <FiUnlock className="w-3.5 h-3.5" /> Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {ips.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-cyber-muted">No blacklisted attackers match the filtering criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-cyber-border pt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-cyber-muted">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                  className="bg-cyber-bg border border-cyber-border rounded-lg text-xs text-white py-1 px-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-cyber-card border border-cyber-border rounded-xl text-cyber-muted hover:text-white disabled:opacity-50 transition"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-xs text-cyber-muted font-mono font-medium">
                  Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-cyber-card border border-cyber-border rounded-xl text-cyber-muted hover:text-white disabled:opacity-50 transition"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attacker Detail Modal */}
      {isDetailsModalOpen && selectedIp && createPortal(
        <div className="fixed inset-0 bg-cyber-bg/85 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fadeIn">
          <div className="w-full max-w-lg bg-cyber-card border border-cyber-border p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Visual Risk Glow */}
            <div className={`absolute -top-12 -left-12 w-32 h-32 blur-[60px] opacity-25 rounded-full ${
              selectedIp.threatScore >= 81 ? 'bg-rose-500' : 'bg-cyan-500'
            }`}></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cyber-border pb-4 mb-4 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiLock className="text-rose-400" /> Attacker Profile Analysis
              </h2>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 hover:bg-zinc-800 text-cyber-muted hover:text-white rounded-lg transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid Details */}
            <div className="space-y-4 relative z-10">
              {/* Threat Level Indicator */}
              <div className="p-4 bg-cyber-bg/50 border border-cyber-border rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-cyber-muted block uppercase tracking-wider font-semibold">Threat Classification</span>
                  <span className={`text-xl font-extrabold tracking-wide ${
                    selectedIp.threatScore >= 81 ? 'text-rose-500' : 
                    selectedIp.threatScore >= 61 ? 'text-amber-500' : 
                    selectedIp.threatScore >= 31 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>{selectedIp.severity} Risk</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-cyber-muted block uppercase tracking-wider font-semibold">Threat Score</span>
                  <span className="text-2xl font-black font-mono text-white">{selectedIp.threatScore} / 100</span>
                </div>
              </div>

              {/* Threat Meter Gauge */}
              <div>
                <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden flex border border-cyber-border">
                  <div 
                    style={{ width: `${selectedIp.threatScore}%` }} 
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedIp.threatScore >= 81 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 
                      selectedIp.threatScore >= 61 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
                      selectedIp.threatScore >= 31 ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    }`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-cyber-muted mt-1.5 font-mono">
                  <span>0 (LOW)</span>
                  <span>30</span>
                  <span>60</span>
                  <span>80</span>
                  <span>100 (CRITICAL)</span>
                </div>
              </div>

              {/* Details table */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiActivity className="w-3.5 h-3.5" /> Target IP</span>
                  <span className="font-mono text-cyan-400 font-bold block mt-1.5">{selectedIp.ip}</span>
                </div>
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiGlobe className="w-3.5 h-3.5" /> Country Location</span>
                  <span className="text-white font-medium block mt-1.5">{selectedIp.country || 'Unknown'}</span>
                </div>
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiAlertTriangle className="w-3.5 h-3.5" /> Attack Reason</span>
                  <span className="text-rose-400 font-semibold block mt-1.5 truncate">{selectedIp.reason}</span>
                </div>
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiShield className="w-3.5 h-3.5" /> Blocked By</span>
                  <span className="text-white font-medium block mt-1.5">{selectedIp.blockedBy}</span>
                </div>
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiClock className="w-3.5 h-3.5" /> Blocked Time</span>
                  <span className="text-cyber-text block mt-1.5 text-xs">{selectedIp.blockedAt ? new Date(selectedIp.blockedAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5" /> Block Expiry</span>
                  <span className="text-cyber-text block mt-1.5 text-xs font-semibold">{selectedIp.expiresAt ? new Date(selectedIp.expiresAt).toLocaleString() : 'Permanent Ban'}</span>
                </div>
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiAlertTriangle className="w-3.5 h-3.5" /> Intercepted Attacks</span>
                  <span className="text-rose-500 font-black font-mono block mt-1.5 text-base">{selectedIp.attackCount}</span>
                </div>
                <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiActivity className="w-3.5 h-3.5" /> Total Inbound Requests</span>
                  <span className="text-rose-500 font-black font-mono block mt-1.5 text-base">{selectedIp.requests}</span>
                </div>
              </div>

              {/* Endpoint Targeted */}
              <div className="bg-cyber-bg/30 border border-cyber-border/40 p-3 rounded-xl">
                <span className="text-xs text-cyber-muted flex items-center gap-1.5"><FiTarget className="w-3.5 h-3.5" /> Target Endpoint Path</span>
                <span className="font-mono text-white block mt-1.5 bg-cyber-bg/60 p-2 rounded-lg border border-cyber-border text-xs truncate">{selectedIp.targetEndpoint}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-cyber-border relative z-10">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-sm font-semibold text-cyber-muted hover:text-white rounded-xl transition"
              >
                Close Profile
              </button>
              {selectedIp.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => {
                    handleUnblock(selectedIp.ip);
                    setIsDetailsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-emerald-600/25"
                >
                  Whitelist & Unblock IP
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Block Custom IP Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-cyber-bg/85 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fadeIn">
          <div className="w-full max-w-md bg-cyber-card border border-cyber-border p-6 rounded-2xl shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FiLock className="text-rose-400 animate-pulse" /> Blacklist Custom IP Address
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
                  placeholder="e.g. Manual admin block for suspicious traffic"
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default BlockedIPs;
