import React from 'react';

const Profile = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Operator Profile</h1>
        <p className="text-cyber-muted mt-1">Operator authorization levels and configuration details.</p>
      </div>

      <div className="glass-panel p-6 rounded-xl max-w-xl border border-cyber-border space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl font-bold">
            AS
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Agent Smith</h3>
            <p className="text-cyber-muted text-sm">Security Level: Administrator</p>
          </div>
        </div>

        <div className="border-t border-cyber-border pt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-cyber-muted">Email</span>
            <span className="text-white font-mono">smith@wadps.local</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-muted">Clearance Level</span>
            <span className="text-emerald-400 font-semibold">L5 - System Admin</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-muted">Status</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
