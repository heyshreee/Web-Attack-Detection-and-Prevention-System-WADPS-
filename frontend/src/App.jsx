import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AttackLogs from './pages/AttackLogs';
import Alerts from './pages/Alerts';
import BlockedIPs from './pages/BlockedIPs';
import Analytics from './pages/Analytics';
import Simulator from './pages/Simulator';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Console Panel Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attack-logs" element={<AttackLogs />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="blocked-ips" element={<BlockedIPs />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="simulator" element={<Simulator />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
