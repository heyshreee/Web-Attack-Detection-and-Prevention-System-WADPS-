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
  FiXCircle,
  FiLock,
  FiGrid,
  FiHardDrive
} from 'react-icons/fi';
import api from '../../services/api';
import axios from 'axios';

const ATTACKS = {
  sqli: {
    name: 'SQL Injection (SQLi)',
    method: 'POST',
    endpoint: '/api/sqli-machine/search',
    paramKey: 'username',
    payload: "' OR '1'='1",
    description: 'Attempts to manipulate database queries by appending SQL union selects to exfiltrate user credentials.',
    impact: 'Exfiltration of sensitive columns, administrative authentication bypass, or complete database breach.'
  },
  xss: {
    name: 'Cross-Site Scripting (XSS)',
    method: 'POST',
    endpoint: '/api/xss-machine/render',
    paramKey: 'payload',
    payload: '<svg/onload=alert(1)>',
    description: 'Attempts to inject executable JavaScript code into web pages viewed by other users.',
    impact: 'Session hijacking, token theft, page defacement, or redirection to malicious phishing domains.'
  },
  traversal: {
    name: 'Path Traversal / LFI',
    method: 'GET',
    endpoint: '/api/traversal-machine/read',
    paramKey: 'payload',
    payload: '../../../../etc/passwd',
    description: 'Attempts to escape the web root directory to access sensitive system files directly on the server.',
    impact: 'Exposure of system users lists, server credentials, application source code, or configuration files.'
  },
  cmd: {
    name: 'Command Injection',
    method: 'POST',
    endpoint: '/api/cmd-machine/exec',
    paramKey: 'payload',
    payload: '; whoami',
    description: 'Attempts to pass shell commands to the operating system command execution pipeline.',
    impact: 'Remote Code Execution (RCE), arbitrary file deletion, malware installations, or complete server takeover.'
  },
  bruteforce: {
    name: 'Brute Force Attack',
    method: 'POST',
    endpoint: '/api/brute-force-machine/login',
    paramKey: 'payload',
    payload: 'admin@wadps.local',
    description: 'Attempts to guess credentials by sending rapid, successive authentication requests.',
    impact: 'Account takeover, password compromise, resource exhaustion, or credential stuffing success.'
  },
  headers: {
    name: 'Suspicious Headers',
    method: 'GET',
    endpoint: '/api/header-machine/check',
    paramKey: 'payload',
    payload: 'X-Hacker: Exploit-Attempt',
    description: 'Injects custom headers containing exploit patterns or malicious tags parsed by the server.',
    impact: 'Bypassing access controls, exploiting header processing flaws, or HTTP request smuggling.'
  },
  scanner: {
    name: 'Scanner Detection',
    method: 'GET',
    endpoint: '/api/scanner-machine/scan',
    paramKey: 'payload',
    payload: 'sqlmap/1.4.12',
    description: 'Simulates scanning patterns by querying routes with scanner-specific User-Agents or probing paths.',
    impact: 'Information disclosure, automated mapping of application attack surface, or service scanning.'
  }
};

const SECURED_LABELS = {
  sqli: 'Secure Code (Parameterized Queries)',
  xss: 'Secure Code (HTML Entity Encoding)',
  traversal: 'Secure Code (Path Whitelisting)',
  cmd: 'Secure Code (Strict Input Validation)',
  bruteforce: 'Secure Code (Lockout & Rate Limit Policy)',
  headers: 'Secure Code (Header Validation)',
  scanner: 'Secure Code (Scanner User-Agent Drops)'
};

const Simulator = () => {
  const [activeTab, setActiveTab] = useState('sqli');
  const [securityActive, setSecurityActive] = useState(true);
  const [customPayload, setCustomPayload] = useState(ATTACKS.sqli.payload);
  const [secured, setSecured] = useState(false);
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
    setSecured(false);
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
    const targetUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${attack.endpoint}`;

    try {
      let response;
      let reqHeaders = {
        Host: 'apiwadps.vercel.app',
        'User-Agent': 'WADPS-Attack-Simulator/1.0',
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };

      if (activeTab === 'sqli') {
        // Run SQLi search machine with extra toggles
        response = await axios.post(targetUrl, {
          username: customPayload,
          secured: secured
        }, {
          validateStatus: () => true
        });
      } else if (activeTab === 'bruteforce') {
        // Run 6 rapid failed login requests to show brute force detection
        let responses = [];
        let wasBlocked = false;
        
        for (let i = 0; i < 6; i++) {
          const res = await axios.post(targetUrl, {
            email: customPayload,
            password: `wrong_password_attempt_${i + 1}`,
            secured: secured
          }, {
            validateStatus: () => true
          });
          
          responses.push({
            attempt: i + 1,
            status: res.status,
            data: res.data
          });
          
          if (res.status === 429 || res.status === 403 || res.data.blocked === true) {
            wasBlocked = true;
          }
          // Brief pause between requests to simulate rapid scanning/attacks
          await new Promise(resolve => setTimeout(resolve, 80));
        }

        const lastRes = responses[responses.length - 1];
        setResult({
          status: lastRes.status,
          statusText: 'Audit Concluded',
          data: {
            message: secured 
              ? 'Repeated login failures triggered Account Lockout Policy.'
              : 'Failed credentials entered. Request processed without account throttle.',
            attempts: responses
          },
          headers: {},
          wasBlocked,
          shieldAtTime: securityActive
        });
        setSimulating(false);
        return;

      } else if (activeTab === 'headers') {
        // Parse custom headers
        const parts = customPayload.split(':');
        let customHeaders = {};
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          customHeaders[name.toLowerCase()] = val;
          reqHeaders[name] = val;
        }

        response = await axios.get(targetUrl, {
          params: { secured: secured },
          headers: customHeaders,
          validateStatus: () => true
        });

      } else if (activeTab === 'scanner') {
        let path = '/api/simulator-machine/scanner';
        let customHeaders = {};

        if (customPayload.startsWith('/')) {
          path = customPayload;
        } else {
          customHeaders['User-Agent'] = customPayload;
          reqHeaders['User-Agent'] = customPayload;
        }

        const finalUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
        response = await axios.get(finalUrl, {
          params: { secured: secured },
          headers: customHeaders,
          validateStatus: () => true
        });

      } else {
        // Standard XSS, Traversal, CMD machine routes
        if (attack.method === 'GET') {
          response = await axios.get(targetUrl, {
            params: { 
              [attack.paramKey]: customPayload,
              secured: secured
            },
            validateStatus: () => true
          });
        } else {
          response = await axios.post(targetUrl, {
            [attack.paramKey]: customPayload,
            secured: secured
          }, {
            validateStatus: () => true
          });
        }
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
        wasBlocked: response.status === 400 || response.status === 403 || response.status === 429 || (response.data && response.data.blocked === true),
        shieldAtTime: securityActive,
        requestHeadersSent: reqHeaders
      });

    } catch (err) {
      console.error('Simulation error:', err);
      setResult({
        status: 500,
        statusText: 'Internal Error',
        data: { error: 'Simulation communication failure' },
        wasBlocked: false,
        shieldAtTime: securityActive,
        requestHeadersSent: {}
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
              const Icon = 
                key === 'sqli' ? FiGlobe : 
                key === 'xss' ? FiAlertTriangle : 
                key === 'traversal' ? FiFileText : 
                key === 'cmd' ? FiTerminal :
                key === 'bruteforce' ? FiLock :
                key === 'headers' ? FiGrid : FiHardDrive;

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
                <span className="text-cyan-400 font-bold">{ATTACKS[activeTab].method}</span> {import.meta.env.VITE_API_URL.replace('/api', '')}{ATTACKS[activeTab].endpoint}
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

            {/* Render Secured Checkbox for all tabs */}
            <div className="flex items-center gap-2.5 bg-cyber-card/60 border border-cyber-border/85 px-3.5 py-3 rounded-xl">
              <input
                type="checkbox"
                id="secured-toggle"
                checked={secured}
                onChange={(e) => setSecured(e.target.checked)}
                className="w-4 h-4 text-cyan-500 border-cyber-border rounded focus:ring-cyan-500/20 bg-cyber-bg cursor-pointer"
              />
              <label htmlFor="secured-toggle" className="text-xs font-semibold text-white cursor-pointer select-none">
                {SECURED_LABELS[activeTab] || 'Secure Code Implementation'}
              </label>
            </div>

            <button
              onClick={handleLaunchSimulation}
              disabled={simulating}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-600/25 disabled:opacity-50"
            >
              <FiPlay className="w-4.5 h-4.5 animate-pulse" />
              {simulating ? 'Running Attack...' : 'Launch Simulation'}
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
                    {result.statusText.toUpperCase()} (HTTP {result.status})
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
                      {JSON.stringify(result.requestHeadersSent || {
                        Host: 'apiwadps.vercel.app',
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

                {/* Simulated SQL Terminal */}
                {activeTab === 'sqli' && result.data && result.data.queryStr && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-cyber-border/80 font-mono text-xs text-white space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-cyber-muted uppercase tracking-wider border-b border-cyber-border/40 pb-1 font-bold">
                      <span>Database Engine Telemetry</span>
                      <span className={result.data.secured ? "text-emerald-400" : "text-rose-400"}>
                        {result.data.secured ? "🛡️ Parameterized Query (Secure)" : "⚠️ String Interpolation (Vulnerable)"}
                      </span>
                    </div>
                    <div className="text-cyan-300 font-semibold break-all whitespace-pre-wrap font-mono">
                      {result.data.queryStr}
                    </div>
                    <div className="text-[10px] text-cyber-muted italic pt-0.5">
                      {result.data.message}
                    </div>
                  </div>
                )}

                {/* Database Leaked / Query Result Table (For SQLi) */}
                {activeTab === 'sqli' && result.data && result.data.results && (
                  <div className="space-y-2">
                    <span className="text-cyber-muted text-xs uppercase block font-mono font-bold">Database Query Results ({result.data.results.length} rows returned)</span>
                    <div className="overflow-x-auto border border-cyber-border/60 rounded-xl bg-cyber-bg/40 max-h-48 scrollbar">
                      <table className="min-w-full divide-y divide-cyber-border/60 text-left text-xs font-mono text-cyber-text">
                        <thead className="bg-cyber-card/80 text-white uppercase text-[9px] tracking-wider sticky top-0">
                          <tr>
                            <th className="px-3 py-2 border-r border-cyber-border/60">ID</th>
                            <th className="px-3 py-2 border-r border-cyber-border/60">Username</th>
                            <th className="px-3 py-2 border-r border-cyber-border/60">Email</th>
                            <th className="px-3 py-2 border-r border-cyber-border/60">Role</th>
                            <th className="px-3 py-2">Secret Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-border/40">
                          {result.data.results.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-3 py-4 text-center text-cyber-muted italic">
                                No database records found. SQL Injection successfully prevented!
                              </td>
                            </tr>
                          ) : (
                            result.data.results.map((row) => {
                              const isSecretLeak = row.secret_flag && row.secret_flag.includes('FLAG');
                              return (
                                <tr key={row.id} className={isSecretLeak ? "bg-rose-950/20 text-rose-300" : "hover:bg-cyber-card/30"}>
                                  <td className="px-3 py-1.5 border-r border-cyber-border/40 text-center">{row.id}</td>
                                  <td className="px-3 py-1.5 border-r border-cyber-border/40 font-bold text-white">{row.username}</td>
                                  <td className="px-3 py-1.5 border-r border-cyber-border/40">{row.email}</td>
                                  <td className="px-3 py-1.5 border-r border-cyber-border/40">
                                    <span className={`px-1 rounded text-[9px] font-bold ${row.role === 'admin' || row.role === 'SUPER_ADMIN' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}`}>
                                      {row.role}
                                    </span>
                                  </td>
                                  <td className={`px-3 py-1.5 font-mono ${isSecretLeak ? 'text-amber-400 font-bold' : 'text-cyber-muted'}`}>{row.secret_flag}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* XSS Code Execution / Preview Terminal */}
                {activeTab === 'xss' && result.data && result.data.renderedOutput !== undefined && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-cyber-border/80 font-mono text-xs">
                        <div className="text-[10px] text-cyber-muted uppercase tracking-wider border-b border-cyber-border/40 pb-1 font-bold mb-2">
                          Reflected Source HTML Code
                        </div>
                        <pre className="text-cyan-300 font-semibold break-all whitespace-pre-wrap font-mono">
                          {`<div>\n  <p>Search Result:</p>\n  ${result.data.renderedOutput}\n</div>`}
                        </pre>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-cyber-border/80 font-mono text-xs">
                        <div className="text-[10px] text-cyber-muted uppercase tracking-wider border-b border-cyber-border/40 pb-1 font-bold mb-2">
                          DOM Script Engine Evaluation
                        </div>
                        <div className={result.data.secured ? "text-emerald-400 font-bold" : "text-rose-400 font-bold animate-pulse"}>
                          {result.data.secured 
                            ? "🛡️ SAFE: HTML tags neutralized. Text rendered literally. No JavaScript execution occurred." 
                            : "⚠️ DANGEROUS: Script tags rendered raw! JavaScript engine triggers alert() / cookie exfiltration."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* OS Command Injection Terminal */}
                {activeTab === 'cmd' && result.data && result.data.commandExecuted && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-cyber-border/80 font-mono text-xs text-white space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-cyber-muted uppercase tracking-wider border-b border-cyber-border/40 pb-1 font-bold">
                      <span>OS Shell Execution Console</span>
                      <span className={result.data.secured ? "text-emerald-400" : "text-rose-400"}>
                        {result.data.secured ? "🛡️ Parameter Validation (Secure)" : "⚠️ String Interpolation (Vulnerable)"}
                      </span>
                    </div>
                    <div className="text-cyan-300 font-semibold break-all whitespace-pre-wrap font-mono">
                      $ {result.data.commandExecuted}
                    </div>
                    <pre className="text-zinc-300 font-mono break-all whitespace-pre-wrap leading-relaxed mt-2 bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                      {result.data.output}
                    </pre>
                  </div>
                )}

                {/* Path Traversal & LFI File Viewer */}
                {activeTab === 'traversal' && result.data && result.data.resolvedPath && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-cyber-border/80 font-mono text-xs text-white space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-cyber-muted uppercase tracking-wider border-b border-cyber-border/40 pb-1 font-bold">
                      <span>File Stream Streamer</span>
                      <span className="text-cyan-300 font-semibold font-mono">{result.data.resolvedPath}</span>
                    </div>
                    <div className="text-[10px] text-cyber-muted italic pb-0.5">
                      File Handler: {result.data.secured ? "Normalized Sandboxed whitelist lookup" : "Concatenated File Stream Reader"}
                    </div>
                    <pre className={`p-3 rounded-lg border text-xs overflow-x-auto h-28 font-mono leading-relaxed bg-black/60 ${
                      result.data.content && result.data.content.includes('FLAG') 
                        ? 'text-amber-400 border-amber-500/25 font-bold animate-pulse' 
                        : 'text-zinc-300 border-zinc-800'
                    }`}>
                      {result.data.content}
                    </pre>
                  </div>
                )}

                {/* Brute Force Login attempts list */}
                {activeTab === 'bruteforce' && result.data && result.data.attempts && (
                  <div className="space-y-2">
                    <span className="text-cyber-muted text-xs uppercase block font-mono font-bold">Rapid Login Request timeline</span>
                    <div className="overflow-x-auto border border-cyber-border/60 rounded-xl bg-cyber-bg/40 max-h-48 scrollbar">
                      <table className="min-w-full divide-y divide-cyber-border/60 text-left text-xs font-mono text-cyber-text">
                        <thead className="bg-cyber-card/80 text-white uppercase text-[9px] tracking-wider sticky top-0">
                          <tr>
                            <th className="px-3 py-2 border-r border-cyber-border/60 text-center">Req #</th>
                            <th className="px-3 py-2 border-r border-cyber-border/60">Email Target</th>
                            <th className="px-3 py-2 border-r border-cyber-border/60">Simulated Password</th>
                            <th className="px-3 py-2 border-r border-cyber-border/60 text-center">HTTP Code</th>
                            <th className="px-3 py-2">Simulation Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-border/40">
                          {result.data.attempts.map((attempt) => {
                            const isLocked = attempt.status === 429 || (attempt.data && attempt.data.locked);
                            const isBlocked = attempt.status === 403 || (attempt.data && attempt.data.blocked);
                            return (
                              <tr key={attempt.attempt} className={isLocked ? "bg-rose-950/20 text-rose-300" : isBlocked ? "bg-amber-950/20 text-amber-300" : "hover:bg-cyber-card/30"}>
                                <td className="px-3 py-1.5 border-r border-cyber-border/40 text-center">{attempt.attempt}</td>
                                <td className="px-3 py-1.5 border-r border-cyber-border/40 font-bold text-white">{customPayload}</td>
                                <td className="px-3 py-1.5 border-r border-cyber-border/40 text-zinc-500">wrong_attempt_{attempt.attempt}</td>
                                <td className="px-3 py-1.5 border-r border-cyber-border/40 text-center font-bold">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    attempt.status === 200 
                                      ? 'bg-emerald-500/20 text-emerald-300' 
                                      : isLocked 
                                      ? 'bg-rose-500/20 text-rose-300' 
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}>
                                    {attempt.status}
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 text-xs font-sans">
                                  {attempt.data.message || (attempt.data.error ? attempt.data.error : "Failed login")}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* HTTP Header Analyzer Output */}
                {activeTab === 'headers' && result.data && result.data.detectedHeaders && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-cyber-border/80 font-mono text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-cyber-muted uppercase tracking-wider border-b border-cyber-border/40 pb-1 font-bold">
                      <span>Header Security telemetry</span>
                      <span className={result.data.secured ? "text-emerald-400" : "text-amber-400"}>
                        {result.data.secured ? "🛡️ Header Drop Policy Active" : "⚠️ Raw Header Parse Active"}
                      </span>
                    </div>
                    <div className="text-[10px] text-cyber-muted mb-1.5">
                      Analyzed Threat Header Key/Values:
                    </div>
                    <pre className="text-zinc-300 font-mono break-all bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                      {JSON.stringify(result.data.detectedHeaders, null, 2)}
                    </pre>
                    <div className="text-[10px] text-cyber-muted italic pt-0.5">
                      {result.data.message}
                    </div>
                  </div>
                )}

                {/* Scanner Detection Output */}
                {activeTab === 'scanner' && result.data && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-cyber-border/80 font-mono text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-cyber-muted uppercase tracking-wider border-b border-cyber-border/40 pb-1 font-bold">
                      <span>Scanner Signature Analyzer</span>
                      <span className={result.data.blocked ? "text-rose-400 animate-pulse" : "text-emerald-400"}>
                        {result.data.blocked ? "🚫 SCANNER BLOCKED" : "✅ PASSED"}
                      </span>
                    </div>
                    <div className="text-zinc-300 font-mono leading-relaxed bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                      <div><span className="text-cyan-400">User-Agent Signature:</span> {result.data.userAgent || 'Unknown'}</div>
                      <div><span className="text-cyan-400">Path Queried:</span> {customPayload.startsWith('/') ? customPayload : '/api/simulator-machine/scanner'}</div>
                    </div>
                    <div className="text-[10px] text-cyber-muted italic pt-0.5">
                      {result.data.message}
                    </div>
                  </div>
                )}

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
                        WADPS successfully inspected and rejected this request at the firewall boundary. The query was blocked before triggering any code operations on the route, protecting the server.
                      </p>
                    ) : (
                      <p>
                        {secured ? (
                          <span>
                            <strong>Defense in Depth:</strong> Even though the WAF firewall was bypassed (Bypass Mode), secure coding practices saved the server! Since the application code was <strong>secured</strong>, the threat was neutralized before execution.
                          </span>
                        ) : (
                          <span>
                            <strong>Risk:</strong> {ATTACKS[activeTab].impact} <br />
                            Because both the security shield and safe programming models were deactivated/missing, the exploit successfully triggered!
                          </span>
                        )}
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
                  WADPS checks inputs and headers against signature lists and regex definitions before routes process data.
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
