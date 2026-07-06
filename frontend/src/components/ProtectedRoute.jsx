import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center text-cyan-400 font-mono">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/25 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm tracking-wider">LOADING ADMIN ENVIRONMENT...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
