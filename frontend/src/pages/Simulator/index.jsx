import React, { useState, useEffect } from 'react';
import { 
  FiPlay, 
  FiShield, 
  FiShieldOff, 
  FiCpu, 
  FiGlobe, 
  FiFileText, 
  FiTerminal, 
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import api from '../../services/api';
import axios from 'axios';

const ATTACKS = {
  sqli: {
    name: 'SQL Injection (SQLi)',
    method: 'GET',
    endpoint: '/health',
    paramKey: 'search',
    payload: '1 UNION SELECT username, password FROM users',
    description: 'Attempts to manipulate database queries by appending SQL union selects to exfiltrate user credentials.',
    impact: 'Exfiltration of sensitive columns, administrative authentication bypass, or complete database breach.'
  },
  xss: {
    name: 'Cross-Site Scripting (XSS)',
    method: 'GET',
    endpoint: '/health',
    paramKey: 'input',
    payload: '<svg/onload=alert(1)>',
    description: 'Attempts to inject executable JavaScript code into web pages viewed by other users.',
    impact: 'Session hijacking, token theft, page defacement, or redirection to malicious phishing domains.'
  },
  traversal: {
    name: 'Path Traversal',
    method: 'GET',
    endpoint: '/health',
    paramKey: 'file',
    payload: '../../../../etc/passwd',
    description: 'Attempts to escape the web root directory to access sensitive system files directly on the server.',
    impact: 'Exposure of system users lists, server credentials, application source code, or configuration files.'
  },
  cmd: {
    name: 'Command Injection',
    method: 'POST',
    endpoint: '/health',
    paramKey: 'cmd',
    payload: '; whoami',
    description: 'Attempts to pass shell commands to the operating system command execution pipeline.',
    impact: 'Remote Code Execution (RCE), arbitrary file deletion, malware installations, or complete server takeover.'
  }
};

const Simulator = () => {
  const [activeTab, setActiveTab] = useState('sqli');
  const [securityActive, setSecurityActive] = useState(true);
  const [customPayload, setCustomPayload] = useState(ATTACKS.sqli.payload);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Result States
  const [result, setResult] = useState(null);

  const fetchSecurityStatus = async () => {
    try {
      const res = await api.get('/admin/security-status');
      setSecurityActive(res.data.active);
    } catch (err) {
      console.error('Error fetching firewall status:', err);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  // Update payload when switching tabs
  useEffect(() => {
    setCustomPayload(ATTACKS[activeTab].payload);
    setResult(null);
  }, [activeTab]);

  const handleToggle = async () => {
    setToggleLoading(true);
    try {
      const updatedState = !securityActive;
      const res = await api.post('/admin/security-status', {
        active: updatedState
      });
      setSecurityActive(res.data.active);
    } catch (err) {
      console.error('Error toggling firewall shield:', err);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleLaunchSimulation = async () => {
    setSimulating(true);
    setResult(null);

    const attack = ATTACKS[activeTab];
    const targetUrl = `http://localhost:5000${attack.endpoint}`;

    try {
      let response;
      if (attack.method === 'GET') {
        response = await axios.get(targetUrl, {
          params: { [attack.paramKey]: customPayload },
          validateStatus: () => true // Prevent axios from throwing error on 400
        });
      } else {
        response = await axios.post(targetUrl, {
          [attack.paramKey]: customPayload
        }, {
          validateStatus: () => true
        });
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
        wasBlocked: response.status === 400 || response.status === 403,
        shieldAtTime: securityActive
      });

    } catch (err) {
      console.error('Simulation error:', err);
      setResult({
        status: 500,
        statusText: 'Internal Error',
        data: { error: 'Simulation communication failure' },
        wasBlocked: false,
        shieldAtTime: securityActive
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FiCpu className="text-cyan-400" /> WAF Attack Simulator
          </h1>
          <p className="text-cyber-muted mt-1">
            Simulate web threats against the backend to test detection filters and explain vulnerability impacts.
          </p>
        </div>

        {/* Global Security Shield Control */}
        <div className="flex items-center gap-4 bg-cyber-card border border-cyber-border px-5 py-3 rounded-2xl shadow-neon-cyan">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                securityActive ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                securityActive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className="text-sm font-semibold text-white flex items-center gap-1.5 font-mono">
              SHIELD: {securityActive ? 'ACTIVE (ON)' : 'BYPASS (OFF)'}
            </span>
          </div>

          <button
            onClick={handleToggle}
            disabled={toggleLoading}
            className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none border border-cyber-border ${
              securityActive ? 'bg-cyan-500/25 border-cyan-500/50' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                securityActive ? 'translate-x-6 bg-cyan-400' : 'translate-x-0 bg-zinc-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Simulator Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Select Attack and Configuration */}
        <div className="glass-panel p-6 rounded-xl border border-cyber-border lg:col-span-1 space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-cyber-border pb-3">
            Simulation Setup
          </h3>

          {/* Attack selector list */}
          <div className="space-y-2">
            {Object.entries(ATTACKS).map(([key, value]) => {
              const Icon = key === 'sqli' ? FiGlobe : key === 'xss' ? FiAlertTriangle : key === 'traversal' ? FiFileText : FiTerminal;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition flex items-center gap-3 text-sm font-medium ${
                    activeTab === key
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-neon-cyan'
                      : 'text-cyber-muted border-transparent hover:text-white hover:bg-cyber-card/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {value.name}
                </button>
              );
            })}
          </div>

          {/* Setup details */}
          <div className="space-y-4 pt-4 border-t border-cyber-border">
            <div>
              <span className="text-cyber-muted text-xs uppercase block mb-1">Target Route</span>
              <div className="bg-cyber-bg p-2.5 rounded-lg border border-cyber-border font-mono text-xs text-white">
                <span className="text-cyan-400 font-bold">{ATTACKS[activeTab].method}</span> http://localhost:5000{ATTACKS[activeTab].endpoint}
              </div>
            </div>

            <div>
              <label className="block text-cyber-muted text-xs uppercase mb-1.5">
                Attack Payload (Key: <span className="text-cyan-400 font-mono">{ATTACKS[activeTab].paramKey}</span>)
              </label>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                rows="3"
                className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-3 py-2 text-rose-400 font-mono text-xs placeholder-cyber-muted focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <button
              onClick={handleLaunchSimulation}
              disabled={simulating}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-600/25 disabled:opacity-50"
            >
              <FiPlay className="w-4.5 h-4.5 animate-pulse" />
              {simulating ? 'Sending Payload...' : 'Launch Simulation'}
            </button>
          </div>
        </div>

        {/* Right Side: Execution Output & Impact Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Output console */}
          <div className="glass-panel p-6 rounded-xl border border-cyber-border space-y-4 flex flex-col justify-between min-h-[22rem]">
            <div>
              <h3 className="text-lg font-semibold text-white border-b border-cyber-border pb-3 flex items-center justify-between">
                <span>Simulation Response Output</span>
                {result && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    result.wasBlocked 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    {result.wasBlocked ? <FiXCircle /> : <FiCheckCircle />}
                    HTTP STATUS {result.status} {result.statusText}
                  </span>
                )}
              </h3>
            </div>

            {result ? (
              <div className="space-y-4 flex-1 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Sent details */}
                  <div className="space-y-2">
                    <span className="text-cyber-muted text-xs uppercase block font-mono">Request Headers</span>
                    <pre className="bg-cyber-bg p-3 rounded-lg border border-cyber-border text-xs text-cyan-400 overflow-x-auto h-28 font-mono">
                      {JSON.stringify({
                        Host: 'localhost:5000',
                        'User-Agent': 'WADPS-Attack-Simulator/1.0',
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                      }, null, 2)}
                    </pre>
                  </div>

                  {/* Received Response */}
                  <div className="space-y-2">
                    <span className="text-cyber-muted text-xs uppercase block font-mono">Response Body</span>
                    <pre className={`bg-cyber-bg p-3 rounded-lg border text-xs overflow-x-auto h-28 font-mono ${
                      result.wasBlocked ? 'text-rose-400 border-rose-500/25 bg-rose-500/5' : 'text-emerald-400 border-cyber-border'
                    }`}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>

                </div>

                {/* Threat Impact Explanation */}
                <div className={`p-4 rounded-xl border flex gap-3 text-sm leading-relaxed ${
                  result.wasBlocked
                    ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
                }`}>
                  <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider font-mono mb-1">
                      {result.wasBlocked ? '🏆 Security Prevention Shield Success' : '⚠️ Exploit Threat Vector Bypassed'}
                    </h4>
                    {result.wasBlocked ? (
                      <p>
                        WADPS successfully inspected and rejected this request at the firewall boundary. The query was blocked before triggering any code operations on the route, protecting the server database from data leaks.
                      </p>
                    ) : (
                      <p>
                        <strong>Risk:</strong> {ATTACKS[activeTab].impact} <br />
                        Because the security shield was deactivated, this query executed directly. In a production server, this payload would bypass authentication or exfiltrate databases!
                      </p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3 border border-dashed border-cyber-border/40 rounded-xl my-4">
                <FiCpu className="w-12 h-12 text-cyber-muted/50 animate-pulse" />
                <div>
                  <p className="text-white text-sm font-semibold">Simulator Ready</p>
                  <p className="text-cyber-muted text-xs max-w-xs mt-1">
                    Select a threat key on the left, toggle your desired firewall state, and click launch to run the test.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Education Explanation Block */}
          <div className="glass-panel p-6 rounded-xl border border-cyber-border space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Vulnerability Explanation: {ATTACKS[activeTab].name}
            </h4>
            <p className="text-sm text-cyber-text leading-relaxed">
              {ATTACKS[activeTab].description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-cyber-border text-xs leading-relaxed">
              <div>
                <span className="text-rose-400 uppercase font-mono font-bold block mb-1">Potential Impact:</span>
                <span className="text-cyber-muted">{ATTACKS[activeTab].impact}</span>
              </div>
              <div>
                <span className="text-cyan-400 uppercase font-mono font-bold block mb-1">Lightweight WAF Detection Rule:</span>
                <span className="text-cyber-muted">
                  WADPS checks inputs against signature lists and regex definitions before routes process data.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Simulator;
