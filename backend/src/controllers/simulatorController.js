import logger from '../config/logger.js';
import { dbStore } from '../services/dbStore.js';

// Mock files database for LFI / Path Traversal simulation
const MOCK_FILES = {
  'welcome.txt': 'Welcome to the WADPS Vulnerability Simulator! Use this file list to understand templates.',
  'about.txt': 'WADPS is a Web Attack Detection and Prevention System built for demonstration and learning.',
  'contact.txt': 'Support contact: admin@wadps.local. Report vulnerabilities here.',
  'etc/passwd': 'root:x:0:0:root:/home/neo:/bin/bash\nneo:x:1000:1000:Neo:/home/neo:/bin/bash\nagent_smith:x:1001:1001:Agent Smith:/home/smith:/bin/sh\nFLAG: FLAG{LFI_TRAVERSAL_EXPLOIT_SUCCESS}',
  'win.ini': '[mail]\nMAPI=1\n[MCI Extensions]\n3g2=MPEGVideo\n[files]\nsecret_key=FLAG{WINDOWS_PATH_TRAVERSAL_SUCCESS}\nhosts=127.0.0.1 localhost'
};

// HTML Escaper for XSS Prevention
const escapeHTML = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * 1. XSS Simulator Machine
 * @route POST /api/simulator-machine/xss
 */
export const simulateXSS = async (req, res) => {
  try {
    const { payload, secured } = req.body;
    const isSecured = secured === true || secured === 'true';

    if (isSecured) {
      // Escape HTML before returning to prevent browser script execution
      const sanitized = escapeHTML(payload || '');
      logger.info(`[XSS MACHINE - SECURE] Sanitized payload: "${sanitized}"`);

      return res.status(200).json({
        secured: true,
        originalPayload: payload,
        renderedOutput: sanitized,
        message: 'Payload sanitized using HTML entity encoding. XSS prevented.'
      });
    } else {
      // Return raw payload (Reflected XSS Simulation)
      logger.warn(`[XSS MACHINE - INSECURE] Returning raw reflected payload: "${payload}"`);

      return res.status(200).json({
        secured: false,
        originalPayload: payload,
        renderedOutput: payload, // Vulnerable reflection
        message: 'Payload returned raw and unsanitized. Vulnerable to Reflected Cross-Site Scripting (XSS).'
      });
    }
  } catch (err) {
    logger.error(`XSS Machine Error: ${err.message}`);
    res.status(500).json({ error: 'XSS Simulation internal error' });
  }
};

/**
 * 2. Command Injection Simulator Machine
 * @route POST /api/simulator-machine/cmd
 */
export const simulateCMD = async (req, res) => {
  try {
    const { payload, secured } = req.body;
    const isSecured = secured === true || secured === 'true';
    const targetInput = (payload || '').trim();

    const cmdTemplate = `ping -c 1 ${targetInput || '[IP]'}`;

    if (isSecured) {
      // Strict IPv4 Validation
      const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      if (!ipv4Regex.test(targetInput)) {
        logger.warn(`[CMD MACHINE - SECURE] Invalid IP format validation block: "${targetInput}"`);
        return res.status(400).json({
          secured: true,
          commandExecuted: 'ping -c 1 [BLOCKED_BY_VALIDATION]',
          output: 'Error: Input validation failed. IP address must match IPv4 format (e.g. 127.0.0.1). Command aborted.',
          message: 'Command execution aborted. Input strictly sanitized using an IP regex whitelist. Command injection prevented.'
        });
      }

      logger.info(`[CMD MACHINE - SECURE] Executing safe ping command for IP: ${targetInput}`);
      const mockOutput = `PING ${targetInput} (${targetInput}) 56(84) bytes of data.\n64 bytes from ${targetInput}: icmp_seq=1 ttl=64 time=0.082 ms\n\n--- ${targetInput} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss, time 0ms\nrtt min/avg/max/mdev = 0.082/0.082/0.082/0.000 ms`;

      return res.status(200).json({
        secured: true,
        commandExecuted: `ping -c 1 ${targetInput}`,
        output: mockOutput,
        message: 'Query executed securely by validating parameters. Command injection prevented.'
      });
    } else {
      // Vulnerable string concatenation simulation
      logger.warn(`[CMD MACHINE - INSECURE] Simulating shell concatenation for input: "${targetInput}"`);

      // Check if they tried to run nested commands
      const connectors = /[;&|]/;
      let output = `PING ${targetInput} (${targetInput.split(/[;&|]/)[0] || '127.0.0.1'}) 56(84) bytes of data...\n`;

      if (connectors.test(targetInput)) {
        // Find injected commands
        const parts = targetInput.split(/[;&|]/).map(p => p.trim());
        const injectedCmds = parts.slice(1);

        output += `--- ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss\n\n[SHELL CONNECTOR TRIGGERED - EXECUTING SUB-COMMANDS]\n`;

        for (const cmd of injectedCmds) {
          const baseCmd = cmd.split(' ')[0].toLowerCase();
          output += `$ ${cmd}\n`;
          if (baseCmd === 'whoami') {
            output += `matrix\\neo\n`;
          } else if (baseCmd === 'id') {
            output += `uid=1000(neo) gid=1000(neo) groups=1000(neo)\n`;
          } else if (baseCmd === 'ipconfig' || baseCmd === 'ifconfig') {
            output += `Ethernet adapter Ethernet0:\n   Connection-specific DNS Suffix  . : local\n   IPv4 Address. . . . . . . . . . . : 192.168.23.44\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.23.1\n`;
          } else if (baseCmd === 'dir' || baseCmd === 'ls') {
            output += `Directory of C:\\Users\\ELCOT\\Documents\\sri'\\new 1\\web-security\\backend\n\n2026-07-05  18:30    <DIR>          src\n2026-07-05  18:30               634  package.json\n2026-07-05  18:30             69938  package-lock.json\n2026-07-05  18:30                60  secret_flags.txt (FLAG{COMMAND_INJECTION_EXPLOIT_COMPLETE})\n`;
          } else if (baseCmd === 'cat' && cmd.includes('passwd')) {
            output += `${MOCK_FILES['etc/passwd']}\n`;
          } else if (baseCmd === 'type' && cmd.includes('win.ini')) {
            output += `${MOCK_FILES['win.ini']}\n`;
          } else {
            output += `sh: ${baseCmd}: command not found or simulation mock response omitted.\n`;
          }
        }
      } else {
        output += `64 bytes from ${targetInput || '127.0.0.1'}: icmp_seq=1 ttl=64 time=0.051 ms\n--- ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`;
      }

      return res.status(200).json({
        secured: false,
        commandExecuted: cmdTemplate,
        output,
        message: 'Query executed using shell string interpolation. Command injection successful.'
      });
    }
  } catch (err) {
    logger.error(`CMD Machine Error: ${err.message}`);
    res.status(500).json({ error: 'Command Injection Simulation internal error' });
  }
};

/**
 * 3. LFI & Path Traversal Simulator Machine
 * @route GET /api/simulator-machine/traversal
 */
export const simulateTraversal = async (req, res) => {
  try {
    const { payload, secured } = req.query;
    const isSecured = secured === true || secured === 'true';
    const filePath = (payload || '').trim();

    if (isSecured) {
      // 1. Strip traversal attempts
      let safePath = filePath.replace(/\.\.\//g, '').replace(/\.\.\\/g, '').replace(/^\/+/, '');
      
      // 2. Validate against allowed whitelist files
      const allowedFiles = ['welcome.txt', 'about.txt', 'contact.txt'];
      const isAllowed = allowedFiles.includes(safePath);

      if (!isAllowed) {
        logger.warn(`[LFI MACHINE - SECURE] Path traversal/LFI validation block for path: "${filePath}"`);
        return res.status(403).json({
          secured: true,
          resolvedPath: 'templates/welcome.txt',
          content: 'Access Denied: You are not authorized to view the requested file, or the path escapes the sandboxed template directory.',
          message: 'Local File Inclusion (LFI) blocked. Paths normalized and matched against a strict file whitelist.'
        });
      }

      logger.info(`[LFI MACHINE - SECURE] Reading safe file path: templates/${safePath}`);
      return res.status(200).json({
        secured: true,
        resolvedPath: `templates/${safePath}`,
        content: MOCK_FILES[safePath] || 'File content not found.',
        message: 'File read safely from restricted templates sandbox.'
      });
    } else {
      // Vulnerable path execution
      logger.warn(`[LFI MACHINE - INSECURE] Reading raw file path input: "${filePath}"`);

      // Resolve path
      let resolvedPath = `templates/${filePath}`;
      let content = 'File not found.';

      // Normalize LFI matching
      const cleanPath = filePath.replace(/\\/g, '/');
      
      // Check if traversal path targets known mock system files
      if (cleanPath.endsWith('etc/passwd') || cleanPath.includes('etc/passwd')) {
        content = MOCK_FILES['etc/passwd'];
      } else if (cleanPath.endsWith('win.ini') || cleanPath.includes('win.ini')) {
        content = MOCK_FILES['win.ini'];
      } else if (MOCK_FILES[cleanPath]) {
        content = MOCK_FILES[cleanPath];
      } else {
        content = `[File System Stream Dump]: Error reading file stream from ${resolvedPath}. Raw file handlers executed on host.`;
      }

      return res.status(200).json({
        secured: false,
        resolvedPath,
        content,
        message: 'File read directly using string concatenation. Vulnerable to Directory Traversal and LFI.'
      });
    }
  } catch (err) {
    logger.error(`LFI Machine Error: ${err.message}`);
    res.status(500).json({ error: 'LFI / Directory Traversal Simulation internal error' });
  }
};

/**
 * 4. Brute Force Simulator Machine
 * @route POST /api/simulator-machine/brute-force
 */
export const simulateBruteForce = async (req, res) => {
  try {
    const { email, password, secured } = req.body;
    const isSecured = secured === true || secured === 'true';
    const clientIP = req.ip;

    const targetEmail = (email || '').toLowerCase().trim();

    if (isSecured) {
      // Check for lockout
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const failures = await dbStore.countFailedLogins(clientIP, oneMinuteAgo);

      if (failures >= 5) {
        logger.warn(`[BRUTE FORCE MACHINE - SECURE] Lockout triggered for IP ${clientIP}. Refusing request.`);
        return res.status(429).json({
          secured: true,
          locked: true,
          failures,
          message: 'Authentication Blocked: Too many login attempts. Your IP has been temporarily locked for 60 seconds (Account Lockout Policy active).'
        });
      }
    }

    // Process simulated credentials
    const isSuccess = targetEmail === 'admin@wadps.local' && password === 'adminPass123';

    if (!isSuccess) {
      // Log failure in LoginHistory
      await dbStore.createLoginHistory({
        email: targetEmail || 'anonymous',
        ip: clientIP,
        success: false,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      // Count failures to report back
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const failures = await dbStore.countFailedLogins(clientIP, oneMinuteAgo);

      logger.info(`[BRUTE FORCE MACHINE] Failed login attempt count: ${failures} from IP: ${clientIP}`);

      return res.status(401).json({
        secured: isSecured,
        locked: false,
        success: false,
        failures,
        message: 'Invalid credentials. Password comparison failed.'
      });
    }

    // Success (Simulated)
    return res.status(200).json({
      secured: isSecured,
      locked: false,
      success: true,
      user: { email: 'admin@wadps.local', role: 'admin' },
      message: 'Login successful. Access token generated.'
    });

  } catch (err) {
    logger.error(`Brute Force Machine Error: ${err.message}`);
    res.status(500).json({ error: 'Brute force login simulation internal error' });
  }
};

/**
 * 5. Suspicious Header Simulator Machine
 * @route GET /api/simulator-machine/suspicious-header
 */
export const simulateSuspiciousHeader = async (req, res) => {
  try {
    const { secured } = req.query;
    const isSecured = secured === true || secured === 'true';

    // Read headers
    const headers = req.headers;
    const suspiciousHeaderNames = ['x-hacker', 'x-exploit', 'x-malicious', 'x-waf-bypass'];
    
    let matchedHdr = null;
    let matchedVal = null;
    
    for (const name of suspiciousHeaderNames) {
      if (headers[name]) {
        matchedHdr = name;
        matchedVal = headers[name];
        break;
      }
    }

    if (isSecured) {
      if (matchedHdr) {
        logger.warn(`[HEADER MACHINE - SECURE] Blocking request due to suspicious custom header: ${matchedHdr}=${matchedVal}`);
        return res.status(400).json({
          secured: true,
          blocked: true,
          message: `Security Block: Suspicious custom HTTP header detected and dropped by security verification [${matchedHdr}].`
        });
      }
      
      // Clean headers
      return res.status(200).json({
        secured: true,
        blocked: false,
        detectedHeaders: {},
        message: 'Request headers analyzed and verified as safe.'
      });
    } else {
      // Insecure: Application processes header blindly
      return res.status(200).json({
        secured: false,
        blocked: false,
        detectedHeaders: matchedHdr ? { [matchedHdr]: matchedVal } : {},
        message: matchedHdr 
          ? `Suspicious header "${matchedHdr}" received and processed by application code. Vulnerability active.` 
          : 'No suspicious custom headers received. Try sending the request with X-Hacker or X-Exploit headers.'
      });
    }

  } catch (err) {
    logger.error(`Suspicious Header Machine Error: ${err.message}`);
    res.status(500).json({ error: 'Suspicious Header simulation internal error' });
  }
};

/**
 * 6. Scanner Detection Simulator Machine
 * @route GET /api/simulator-machine/scanner
 */
export const simulateScanner = async (req, res) => {
  try {
    const { secured } = req.query;
    const isSecured = secured === true || secured === 'true';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (isSecured) {
      // Check if it's a scanning user-agent
      const isScanUA = /sqlmap|nikto|acunetix|nmap|nessus/i.test(userAgent);
      if (isScanUA) {
        logger.warn(`[SCANNER MACHINE - SECURE] Blocking automated scanner traffic: UA=${userAgent}`);
        return res.status(403).json({
          secured: true,
          blocked: true,
          message: `Access Denied: Automated vulnerability scanners are blocked from indexing the system. User-Agent matches signature.`
        });
      }

      return res.status(200).json({
        secured: true,
        blocked: false,
        userAgent,
        message: 'Request parsed. Safe User-Agent verification completed.'
      });
    } else {
      // Insecure: Allow scanner UA to hit code
      return res.status(200).json({
        secured: false,
        blocked: false,
        userAgent,
        message: 'Automated vulnerability scanner allowed to crawl routes and gather system telemetry.'
      });
    }

  } catch (err) {
    logger.error(`Scanner Machine Error: ${err.message}`);
    res.status(500).json({ error: 'Scanner simulation internal error' });
  }
};
