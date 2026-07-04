import logger from './src/config/logger.js';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  logger.info('--- Starting WADPS Extended Security Detection Tests ---');

  // Test 1: Benign Request
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

  logger.info('--- WADPS Extended Security Detection Tests Complete ---');
}

runTests();
