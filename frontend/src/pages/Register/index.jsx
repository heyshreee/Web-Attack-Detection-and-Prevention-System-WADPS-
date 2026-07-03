import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Register submit', { name, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 border border-cyber-border shadow-neon-cyan">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Register Operator</h2>
          <p className="text-cyber-muted text-sm mt-1">Establish your security clearance credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-cyber-muted mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2.5 text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              placeholder="Agent Smith"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyber-muted mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2.5 text-white placeholder-cyber-muted focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              placeholder="smith@wadps.local"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyber-muted mb-2">Security Password</label>
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
            Create Operator Profile
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-cyber-muted">
            Already registered?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Authenticate here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
