import React from 'react';

const Profile = () => {
  const userStr = localStorage.getItem('user');
  let user = { name: 'Operator', email: 'operator@wadps.local', role: 'operator' };
  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (err) {
    console.error('Error loading profile storage data:', err);
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OP';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Operator Profile</h1>
        <p className="text-cyber-muted mt-1">Operator authorization levels and configuration details.</p>
      </div>

      <div className="glass-panel p-6 rounded-xl max-w-xl border border-cyber-border space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user.name}</h3>
            <p className="text-cyber-muted text-sm uppercase font-mono">
              Security Level: {user.role === 'admin' ? 'Administrator' : 'Operator'}
            </p>
          </div>
        </div>

        <div className="border-t border-cyber-border pt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-cyber-muted">Email</span>
            <span className="text-white font-mono">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-muted">Clearance Level</span>
            <span className="text-emerald-400 font-semibold font-mono">
              {user.role === 'admin' ? 'L5 - System Admin' : 'L2 - Standard Operator'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-muted">Status</span>
            <span className="text-emerald-400 font-mono">ACTIVE_SESSION</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
