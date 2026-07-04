import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiDownload, FiSearch, FiRotateCw, FiEye, FiTrash2, FiX } from 'react-icons/fi';
import api from '../../services/api';

const AttackLogs = () => {
  const [searchParams] = useSearchParams();
  const urlIp = searchParams.get('ip');

  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAttackLogs = async (customSearch = null) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        severity: filter,
        search: customSearch !== null ? customSearch : search
      };
      const res = await api.get('/logs/attacks', { params });
      setLogs(res.data.logs);
      setTotalPages(res.data.pagination.pages);
      setTotalLogs(res.data.pagination.total);
    } catch (err) {
      console.error('Error loading attack logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlIp) {
      setSearch(urlIp);
      fetchAttackLogs(urlIp);
    } else {
      fetchAttackLogs();
    }
  }, [page, filter, urlIp]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAttackLogs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this security threat log?')) {
      return;
    }
    try {
      await api.delete(`/logs/attacks/${id}`);
      setLogs(logs.filter(log => log._id !== id));
      setTotalLogs(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting attack log:', err);
      alert('Failed to delete attack log.');
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await api.get(`/logs/export?type=attack&format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wadps_attack_logs_${Date.now()}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading log report:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Attack Logs</h1>
          <p className="text-cyber-muted mt-1">Detailed repository of blocked malicious requests and payloads ({totalLogs} recorded).</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-cyber-border text-sm font-medium text-cyber-text rounded-xl hover:text-white hover:border-cyber-muted transition disabled:opacity-50"
          >
            <FiDownload /> Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-cyber-border text-sm font-medium text-cyber-text rounded-xl hover:text-white hover:border-cyber-muted transition disabled:opacity-50"
          >
            <FiDownload /> Export JSON
          </button>
        </div>
      </div>

      {/* Filters Banner */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-cyber-card border border-cyber-border p-4 rounded-xl">
        <div className="flex gap-2">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setFilter(lvl);
                setPage(1);
              }}
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
        
        <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex gap-2">
          <input
            type="text"
            placeholder="Search by IP, Type, Payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2 text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <FiSearch /> Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setPage(1);
              fetchAttackLogs('');
            }}
            title="Refresh logs"
            className="px-3 py-2 bg-zinc-800 border border-cyber-border rounded-lg text-cyber-muted hover:text-white transition"
          >
            <FiRotateCw />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="text-cyber-muted font-mono text-sm">Querying logs database...</span>
        </div>
      ) : (
        <>
          <div className="glass-panel rounded-xl overflow-hidden border border-cyber-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyan-950/20 text-xs font-semibold uppercase tracking-wider text-cyber-muted">
                    <th className="p-4">Time</th>
                    <th className="p-4">Attack Type</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Method & Endpoint</th>
                    <th className="p-4">Blocked Payload</th>
                    <th className="p-4 font-mono">Source IP</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border text-sm text-cyber-text">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-cyber-card/30 transition">
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
                      <td className="p-4 whitespace-nowrap font-mono text-xs text-cyan-400">
                        {log.method} {log.url}
                      </td>
                      <td className="p-4 max-w-xs truncate font-mono text-xs text-cyber-muted" title={log.payload}>
                        {log.payload}
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono text-xs">{log.ip}</td>
                      <td className="p-4 whitespace-nowrap text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="View Details"
                          className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg transition"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(log._id)}
                          title="Delete Log"
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-cyber-muted">
                        No logs matching criteria found in MongoDB cluster database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-cyber-border pt-4">
              <span className="text-xs text-cyber-muted font-mono">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="px-4 py-1.5 bg-zinc-800 border border-cyber-border text-xs font-medium text-cyber-text rounded-lg hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-4 py-1.5 bg-zinc-800 border border-cyber-border text-xs font-medium text-cyber-text rounded-lg hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inspect Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-2xl bg-cyber-card border border-cyber-border rounded-2xl shadow-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-cyber-border bg-[#0e1526]/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🔍 Threat Vector Details
              </h2>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-cyber-muted hover:text-white transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-mono text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-cyber-border pb-4">
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">Attack Vector</span>
                  <span className="text-white font-bold">{selectedLog.attackType}</span>
                </div>
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">Severity</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                    selectedLog.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>{selectedLog.severity}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-cyber-border pb-4">
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">Source IP</span>
                  <span className="text-cyan-400">{selectedLog.ip}</span>
                </div>
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">Country / Source</span>
                  <span className="text-white">{selectedLog.country || 'Localhost (Filtered)'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-cyber-border pb-4">
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">HTTP Method</span>
                  <span className="text-white font-semibold">{selectedLog.method}</span>
                </div>
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">Target Endpoint</span>
                  <span className="text-white text-xs break-all">{selectedLog.url}</span>
                </div>
              </div>

              <div className="border-b border-cyber-border pb-4">
                <span className="text-cyber-muted text-xs uppercase block mb-1">User Agent</span>
                <span className="text-white text-xs break-all leading-relaxed block bg-cyber-bg p-3 rounded-lg border border-cyber-border">
                  {selectedLog.userAgent || 'None Provided'}
                </span>
              </div>

              <div className="border-b border-cyber-border pb-4">
                <span className="text-cyber-muted text-xs uppercase block mb-1">Blocked Payload</span>
                <pre className="text-rose-400 text-xs break-all whitespace-pre-wrap leading-relaxed block bg-rose-500/5 p-3 rounded-lg border border-rose-500/25">
                  {selectedLog.payload}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">Inspect Timestamp</span>
                  <span className="text-cyber-muted text-xs">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-cyber-muted text-xs uppercase block">Inspection Status</span>
                  <span className="text-rose-400 font-bold text-xs uppercase">BLOCKED (400 Bad Request)</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-cyber-border bg-[#0e1526]/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-cyan-600/20"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AttackLogs;
