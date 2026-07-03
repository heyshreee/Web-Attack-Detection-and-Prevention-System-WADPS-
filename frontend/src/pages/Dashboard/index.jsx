import React from 'react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-cyber-muted mt-1">Real-time web attack monitoring status.</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          System Protection Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder cards */}
        {['Total Requests', 'Blocked Requests', "Today's Attacks", 'Blocked IPs'].map((title, i) => (
          <div key={i} className="glass-panel glass-panel-hover p-6 rounded-xl">
            <h3 className="text-cyber-muted text-sm font-medium">{title}</h3>
            <p className="text-3xl font-semibold text-white mt-2">0</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
