import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiLogOut, FiMenu } from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();

  // Load actual user details
  const userStr = localStorage.getItem('user');
  let user = { name: 'Operator', role: 'operator' };
  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (err) {
    console.error('Error parsing user storage details:', err);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-cyber-card/80 backdrop-blur border-b border-cyber-border px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button className="md:hidden text-cyber-muted hover:text-white p-1">
          <FiMenu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-xs text-cyber-muted font-mono bg-cyber-bg px-3 py-1.5 rounded-lg border border-cyber-border">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
          SEC_SHELL_CONNECTED
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Alerts Bell Indicator */}
        <button 
          onClick={() => navigate('/alerts')}
          className="relative text-cyber-muted hover:text-white transition p-1.5 rounded-lg hover:bg-cyber-border/40"
        >
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>

        {/* User profile dropdown / preview */}
        <div className="flex items-center gap-3 border-l border-cyber-border pl-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-white leading-none">{user.name}</p>
            <span className="text-[10px] text-cyber-muted font-mono uppercase">
              {user.role === 'admin' ? 'L5 Admin' : 'L2 Operator'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Terminate Session"
            className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
