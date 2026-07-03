import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiShield, FiAlertTriangle, FiActivity, FiSlash, FiSettings, FiUser } from 'react-icons/fi';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiShield },
    { name: 'Attack Logs', path: '/attack-logs', icon: FiActivity },
    { name: 'Alert Center', path: '/alerts', icon: FiAlertTriangle },
    { name: 'Blocked IPs', path: '/blocked-ips', icon: FiSlash },
    { name: 'Settings', path: '/settings', icon: FiSettings },
    { name: 'Profile', path: '/profile', icon: FiUser },
  ];

  return (
    <aside className="w-64 bg-cyber-card border-r border-cyber-border min-h-screen flex flex-col hidden md:flex">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-cyber-border bg-[#0e1526]/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
            W
          </div>
          <span className="font-bold text-white tracking-wider text-sm">WADPS ADMIN</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                    : 'text-cyber-muted hover:text-white hover:bg-cyber-border/30'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-cyber-border bg-[#0e1526]/30">
        <div className="text-xs text-cyber-muted text-center font-mono">
          FW v1.0.0 // SEC_ACTIVE
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
