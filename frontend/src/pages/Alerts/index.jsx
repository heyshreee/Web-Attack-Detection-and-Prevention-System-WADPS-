import React, { useState } from 'react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([
    { id: '1', level: 'CRITICAL', title: 'Multiple SQL Injection payloads from 192.168.1.15', time: '5 mins ago', read: false },
    { id: '2', level: 'WARNING', title: 'Rate limiting threshold reached by 198.51.100.12', time: '12 mins ago', read: false },
    { id: '3', level: 'INFO', title: 'New operator registered: Agent Smith', time: '1 hour ago', read: true }
  ]);

  const markAsRead = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Alert Center</h1>
        <p className="text-cyber-muted mt-1">Real-time alerts and notifications from the detection middleware.</p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`glass-panel p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
              alert.read ? 'opacity-60 border-cyber-border' : 'border-cyan-500/30 shadow-neon-cyan'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                alert.level === 'CRITICAL' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : alert.level === 'WARNING' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {alert.level}
              </span>
              <div>
                <h4 className="text-white font-medium text-base">{alert.title}</h4>
                <p className="text-cyber-muted text-xs mt-1">{alert.time}</p>
              </div>
            </div>

            {!alert.read && (
              <button
                onClick={() => markAsRead(alert.id)}
                className="whitespace-nowrap px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition"
              >
                Mark Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
