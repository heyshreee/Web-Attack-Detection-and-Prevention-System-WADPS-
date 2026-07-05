import logger from './src/config/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function getAdminToken() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@wadps.local', password: 'password' })
    });
    if (res.status === 200) {
      const data = await res.json();
      return data.token;
    }
  } catch (err) {
    logger.error(`Error logging in as admin: ${err.message}`);
  }
  return null;
}

async function setWafShield(token, active) {
  if (!token) return;
  try {
    await fetch(`${BASE_URL}/api/admin/security-status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ active })
    });
  } catch (err) {
    logger.error(`Error changing security-status: ${err.message}`);
  }
}

async function runTests() {
  logger.info('--- Starting WADPS Extended Security Detection Tests ---');

  const token = await getAdminToken();
  if (token) {
    logger.info('🔑 Admin authentication successful.');
  } else {
    logger.warn('⚠️ Could not obtain admin auth token. Some tests may fail if IP gets blacklisted.');
  }

  // Helper to reset blacklist and logs on the server for the test IP
  const resetState = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.status !== 200) {
        logger.warn(`Failed to reset IP state: status ${res.status}`);
      }
    } catch (err) {
      logger.error(`Error calling reset-ip endpoint: ${err.message}`);
    }
  };

  // Test 1: Benign Request
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    logger.info(`Test 1 (Clean Request): Status ${res.status}`);
    if (res.status === 200) {
      logger.info('✅ Test 1 Passed: Clean request allowed.');
    } else {
      logger.error('❌ Test 1 Failed: Clean request blocked.');
    }
  } catch (err) {
    logger.error(`Test 1 Error: ${err.message}`);
  }

  // Test 2: SQL Injection
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/health?search=1%20UNION%20SELECT%20username,%20password%20FROM%20users`);
    const data = await res.json();
    logger.info(`Test 2 (SQL Injection Query): Status ${res.status} - Type: ${data.type}`);
    if (res.status === 400 && data.blocked === true && data.type === 'SQL Injection') {
      logger.info('✅ Test 2 Passed: SQL Injection successfully blocked!');
    } else {
      logger.error('❌ Test 2 Failed: SQL Injection allowed.');
    }
  } catch (err) {
    logger.error(`Test 2 Error: ${err.message}`);
  }

  // Test 3: XSS Attempt
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: '<svg/onload=alert(1)>' })
    });
    const data = await res.json();
    logger.info(`Test 3 (XSS Body payload): Status ${res.status} - Type: ${data.type}`);
    if (res.status === 400 && data.blocked === true && data.type === 'XSS Attempt') {
      logger.info('✅ Test 3 Passed: XSS script injection successfully blocked!');
    } else {
      logger.error('❌ Test 3 Failed: XSS payload allowed.');
    }
  } catch (err) {
    logger.error(`Test 3 Error: ${err.message}`);
  }

  // Test 4: Path Traversal
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/health?file=../../../../etc/passwd`);
    const data = await res.json();
    logger.info(`Test 4 (Path Traversal Query): Status ${res.status} - Type: ${data.type}`);
    if (res.status === 400 && data.blocked === true && data.type === 'Path Traversal') {
      logger.info('✅ Test 4 Passed: Path Traversal successfully blocked!');
    } else {
      logger.error('❌ Test 4 Failed: Path Traversal allowed.');
    }
  } catch (err) {
    logger.error(`Test 4 Error: ${err.message}`);
  }

  // Test 5: Command Injection
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arg: '; whoami' })
    });
    const data = await res.json();
    logger.info(`Test 5 (Command Injection Body): Status ${res.status} - Type: ${data.type}`);
    if (res.status === 400 && data.blocked === true && data.type === 'Command Injection') {
      logger.info('✅ Test 5 Passed: Command Injection successfully blocked!');
    } else {
      logger.error('❌ Test 5 Failed: Command Injection allowed.');
    }
  } catch (err) {
    logger.error(`Test 5 Error: ${err.message}`);
  }

  // Test 6: Suspicious Header
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: {
        'X-Hacker': 'Exploit-Test-Payload'
      }
    });
    const data = await res.json();
    logger.info(`Test 6 (Suspicious Header): Status ${res.status} - Type: ${data.type}`);
    if ((res.status === 400 || res.status === 403) && data.blocked === true && data.type === 'Suspicious Header') {
      logger.info('✅ Test 6 Passed: Suspicious Header successfully blocked!');
    } else {
      logger.error('❌ Test 6 Failed: Suspicious Header allowed.');
    }
  } catch (err) {
    logger.error(`Test 6 Error: ${err.message}`);
  }

  // Test 7: Scanner User-Agent Detection
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: {
        'User-Agent': 'sqlmap/1.4.12'
      }
    });
    const data = await res.json();
    logger.info(`Test 7 (Scanner User-Agent): Status ${res.status} - Type: ${data.type}`);
    if ((res.status === 400 || res.status === 403) && data.blocked === true && data.type === 'Scanner Detection') {
      logger.info('✅ Test 7 Passed: Scanner User-Agent successfully blocked!');
    } else {
      logger.error('❌ Test 7 Failed: Scanner User-Agent allowed.');
    }
  } catch (err) {
    logger.error(`Test 7 Error: ${err.message}`);
  }

  // Test 8: Scanner Path Probe (Sensitive File Probe)
  await resetState();
  try {
    const res = await fetch(`${BASE_URL}/.git/config`);
    const data = await res.json();
    logger.info(`Test 8 (Scanner Path Probe): Status ${res.status} - Type: ${data.type}`);
    if ((res.status === 400 || res.status === 403) && data.blocked === true && data.type === 'Scanner Detection') {
      logger.info('✅ Test 8 Passed: Scanner Path Probe successfully blocked!');
    } else {
      logger.error('❌ Test 8 Failed: Scanner Path Probe allowed.');
    }
  } catch (err) {
    logger.error(`Test 8 Error: ${err.message}`);
  }

  // Test 9: Brute Force Prevention (simulate multiple failed logins with WAF disabled to test application lockout)
  await resetState();
  if (token) {
    await setWafShield(token, false); // Disable WAF to bypass gateway checks
    logger.info('🛡️ WAF Firewall Shield temporarily disabled for Application Lockout test.');
  }
  try {
    logger.info('Simulating consecutive login failures for Brute Force test...');
    let lastResStatus = 200;
    let lastData = {};
    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${BASE_URL}/api/brute-force-machine/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'attacker@wadps.local', password: `guess_${i}`, secured: true })
      });
      lastResStatus = res.status;
      lastData = await res.json();
    }
    logger.info(`Test 9 (Brute Force Lockout): Last attempt status ${lastResStatus} - Response: ${JSON.stringify(lastData)}`);
    if (lastResStatus === 429 && lastData.locked === true) {
      logger.info('✅ Test 9 Passed: Brute Force lockout successfully triggered!');
    } else {
      logger.error('❌ Test 9 Failed: Brute Force lockout not triggered.');
    }
  } catch (err) {
    logger.error(`Test 9 Error: ${err.message}`);
  } finally {
    if (token) {
      await setWafShield(token, true); // Re-enable WAF
      logger.info('🛡️ WAF Firewall Shield re-enabled.');
    }
  }

  // Clear blacklist one final time to leave environment clean
  await resetState();

  logger.info('--- WADPS Extended Security Detection Tests Complete ---');
}

runTests();
