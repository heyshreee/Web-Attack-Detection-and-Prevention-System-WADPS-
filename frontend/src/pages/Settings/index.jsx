import React from 'react';

const Settings = () => {
  const userStr = localStorage.getItem('user');
  let user = { name: 'Operator', email: 'operator@wadps.local', role: 'operator', id: 'N/A' };
  try {
    if (userStr) {
      const parsed = JSON.parse(userStr);
      user = { ...user, ...parsed };
    }
  } catch (err) {
    console.error('Error loading settings storage details:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-cyber-muted mt-1">Configure operator profile, credentials, and console theme.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="glass-panel p-6 rounded-xl border border-cyber-border">
            <h3 className="text-lg font-medium text-white mb-4">Operator Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-muted mb-2">Display Name</label>
                <input
                  type="text"
                  disabled
                  value={user.name}
                  className="w-full bg-cyber-card border border-cyber-border rounded-lg px-4 py-2 text-cyber-muted text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyber-muted mb-2">Operator ID / Clearance</label>
                <input
                  type="text"
                  value={user.id || user._id || 'OP-8820'}
                  disabled
                  className="w-full bg-cyber-card border border-cyber-border rounded-lg px-4 py-2 text-cyber-muted text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Password Reset Placeholder */}
          <div className="glass-panel p-6 rounded-xl border border-cyber-border">
            <h3 className="text-lg font-medium text-white mb-4">Update Access Credentials</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyber-muted mb-2">Current Access Key</label>
                <input
                  type="password"
                  disabled
                  className="w-full bg-cyber-card border border-cyber-border rounded-lg px-4 py-2 text-cyber-muted text-sm cursor-not-allowed"
                  placeholder="•••••••• (Security settings locked)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-cyber-border">
            <h3 className="text-lg font-medium text-white mb-4">Console Theme</h3>
            <div className="space-y-3">
              {[
                { name: 'Matrix Neon (Dark)', desc: 'Glowing cyan and red accents on slate dark background', active: true },
                { name: 'Standard Light', desc: 'Standard light theme (not recommended for operators)', active: false }
              ].map((theme, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    theme.active 
                      ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400' 
                      : 'border-cyber-border hover:border-cyber-muted text-cyber-text'
                  }`}
                >
                  <p className="font-semibold text-sm">{theme.name}</p>
                  <p className="text-xs text-cyber-muted mt-1">{theme.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
