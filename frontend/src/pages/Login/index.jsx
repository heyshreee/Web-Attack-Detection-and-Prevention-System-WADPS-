import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submit', { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg px-4 relative overflow-hidden">
      {/* Decorative cyber grid or glow background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 border border-cyber-border shadow-neon-cyan">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">WADPS Security Login</h2>
          <p className="text-cyber-muted text-sm mt-1">Authenticate to access management console.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-cyber-muted mb-2">Security ID / Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2.5 text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              placeholder="admin@wadps.local"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyber-muted mb-2">Access Key / Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2.5 text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shadow-cyan-600/25 active:scale-[0.98]"
          >
            Decrypt & Authenticate
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-cyber-muted">
            New operator?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Register Credentials
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
