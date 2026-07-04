import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll alerts every 3 seconds for lively warning notifications
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, read: true } : a))
      );
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/alerts/clear');
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (err) {
      console.error('Error clearing alerts:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this security alert?')) {
      return;
    }
    try {
      await api.delete(`/alerts/${id}`);
      setAlerts(alerts.filter((a) => a._id !== id));
    } catch (err) {
      console.error('Error deleting alert:', err);
      alert('Failed to delete alert.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FiAlertCircle className="text-rose-400" /> Alert Center
          </h1>
          <p className="text-cyber-muted mt-1">Real-time alerts and notifications from the detection middleware.</p>
        </div>

        {alerts.some((a) => !a.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-cyber-border text-sm font-medium text-cyber-text rounded-xl hover:text-white hover:border-cyber-muted transition"
          >
            <FiCheckSquare /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="text-cyber-muted font-mono text-sm">Synchronizing warning center...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`glass-panel p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                alert.read ? 'opacity-50 border-cyber-border' : 'border-cyan-500/30 shadow-neon-cyan'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    alert.level === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : alert.level === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {alert.level}
                </span>
                <div>
                  <h4 className="text-white font-medium text-base">{alert.title}</h4>
                  <p className="text-cyber-muted text-sm mt-1">{alert.message}</p>
                  <p className="text-cyber-muted text-xs mt-1.5 font-mono">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!alert.read && (
                  <button
                    onClick={() => markAsRead(alert._id)}
                    className="whitespace-nowrap px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(alert._id)}
                  title="Delete Alert"
                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition"
                >
                  <FiTrash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="glass-panel p-8 text-center text-cyber-muted rounded-xl border border-cyber-border">
              All secure. No new system security events.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
