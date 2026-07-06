import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiActivity } from 'react-icons/fi';
import api from '../../services/api';

const COLORS = ['#00FFA3', '#f43f5e', '#f59e0b', '#3b82f6', '#a855f7'];

const Analytics = () => {
  const [data, setData] = useState({
    timeline: [],
    attackTypes: [],
    attackSeverities: [],
    topIPs: [],
    topEndpoints: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      const res = await api.get('/dashboard/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    // Poll analytics every 3 seconds for lively graphical updates
    const interval = setInterval(fetchAnalyticsData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        <p className="text-cyber-muted font-mono text-sm">Aggregating Security Metrics...</p>
      </div>
    );
  }

  // Format type & severity distributions for Recharts Pie charts
  const typeChartData = data.attackTypes.map(item => ({
    name: item._id,
    value: item.count
  }));

  const severityChartData = data.attackSeverities.map(item => ({
    name: item._id,
    value: item.count
  }));

  const topIpChartData = data.topIPs.map(item => ({
    ip: item._id,
    attacks: item.count
  }));

  const topEndpointChartData = data.topEndpoints.map(item => ({
    endpoint: item._id,
    attacks: item.count
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <FiBarChart2 className="text-cyan-400" /> Security Analytics
        </h1>
        <p className="text-cyber-muted mt-1">Deep analysis of system traffic, severity patterns, and top security threats.</p>
      </div>

      {/* Timeline Area Chart (Full Width) */}
      <div className="glass-panel p-6 rounded-xl border border-cyber-border">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-cyan-400 w-5 h-5" />
          <h3 className="text-lg font-medium text-white">Attack Frequency Timeline</h3>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFA3" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00FFA3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12, fontFamily: 'monospace' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: 12, fontFamily: 'monospace' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                labelStyle={{ color: '#00FFA3', fontFamily: 'monospace' }}
                itemStyle={{ color: '#F2F2F2' }}
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
              <Area type="monotone" dataKey="requests" name="Total HTTP Traffic" stroke="#00FFA3" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={2} />
              <Area type="monotone" dataKey="attacks" name="Blocked Threats" stroke="#f43f5e" fillOpacity={1} fill="url(#colorAttacks)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Types Distribution */}
        <div className="glass-panel p-6 rounded-xl border border-cyber-border">
          <div className="flex items-center gap-2 mb-4">
            <FiPieChart className="text-cyan-400 w-5 h-5" />
            <h3 className="text-lg font-medium text-white">Attack Type Distribution</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#F2F2F2' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cyber-muted text-sm font-mono">No attack categories detected</p>
            )}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="glass-panel p-6 rounded-xl border border-cyber-border">
          <div className="flex items-center gap-2 mb-4">
            <FiPieChart className="text-rose-400 w-5 h-5" />
            <h3 className="text-lg font-medium text-white">Threat Severity Distribution</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {severityChartData.map((entry, index) => {
                      let color = '#3b82f6'; // default blue
                    const name = String(entry.name).toUpperCase();
                    if (name === 'CRITICAL') color = '#991b1b'; // dark red
                    else if (name === 'HIGH') color = '#f43f5e'; // rose/light red
                    else if (name === 'MEDIUM') color = '#f59e0b'; // amber
                    else if (name === 'LOW') color = '#00FFA3'; // Cyber Green
                    else if (name === 'INFO') color = '#10b981'; // emerald green
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                  itemStyle={{ color: '#F2F2F2' }}
                />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cyber-muted text-sm font-mono">No severity statistics available</p>
            )}
          </div>
        </div>

        {/* Top Attacking IPs */}
        <div className="glass-panel p-6 rounded-xl border border-cyber-border">
          <div className="flex items-center gap-2 mb-4">
            <FiActivity className="text-cyan-400 w-5 h-5" />
            <h3 className="text-lg font-medium text-white">Top Attacking IP Addresses</h3>
          </div>
          <div className="h-64">
            {topIpChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topIpChartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis dataKey="ip" type="category" stroke="#9ca3af" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#F2F2F2' }}
                  />
                  <Bar dataKey="attacks" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-cyber-muted text-sm font-mono">No IP source blocks recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Targeted Endpoints */}
        <div className="glass-panel p-6 rounded-xl border border-cyber-border">
          <div className="flex items-center gap-2 mb-4">
            <FiShield className="text-cyan-400 w-5 h-5" />
            <h3 className="text-lg font-medium text-white">Most Targeted Endpoints</h3>
          </div>
          <div className="h-64">
            {topEndpointChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEndpointChartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="endpoint" stroke="#9ca3af" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#F2F2F2' }}
                  />
                  <Bar dataKey="attacks" fill="#00FFA3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-cyber-muted text-sm font-mono">No endpoint metrics found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple helper components to make pages align
const FiShield = (props) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default Analytics;
