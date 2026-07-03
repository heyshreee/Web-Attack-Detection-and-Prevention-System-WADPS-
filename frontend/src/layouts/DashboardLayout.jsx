import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Navbar from '../components/navbar/Navbar';

const DashboardLayout = () => {
  return (
    <div className="flex bg-cyber-bg min-h-screen text-cyber-text">
      {/* Sidebar - fixed on left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-grow p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
