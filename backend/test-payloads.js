import logger from './src/config/logger.js';

const PORT = 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  logger.info('--- Starting WADPS Detection Engine Verification Tests ---');

  // Test 1: Benign / Clean request
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    logger.info(`Test 1 (Clean Request): Status ${res.status} - Response: ${JSON.stringify(data)}`);
    if (res.status === 200) {
      logger.info('✅ Test 1 Passed: Clean request allowed.');
    } else {
      logger.error('❌ Test 1 Failed: Clean request blocked.');
    }
  } catch (err) {
    logger.error(`Test 1 Error: ${err.message}`);
  }

  // Test 2: SQL Injection query payload
  try {
    const maliciousUrl = `${BASE_URL}/health?search=1%20UNION%20SELECT%20username,%20password%20FROM%20users%20--`;
    const res = await fetch(maliciousUrl);
    const data = await res.json();
    logger.info(`Test 2 (SQL Injection URL Query): Status ${res.status} - Response: ${JSON.stringify(data)}`);
    if (res.status === 400 && data.blocked === true) {
      logger.info('✅ Test 2 Passed: SQL Injection query successfully blocked!');
    } else {
      logger.error('❌ Test 2 Failed: SQL Injection query allowed through.');
    }
  } catch (err) {
    logger.error(`Test 2 Error: ${err.message}`);
  }

  // Test 3: XSS Body payload
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: '<script>alert("hack")</script>',
      }),
    });
    const data = await res.json();
    logger.info(`Test 3 (XSS JSON Body): Status ${res.status} - Response: ${JSON.stringify(data)}`);
    if (res.status === 400 && data.blocked === true) {
      logger.info('✅ Test 3 Passed: XSS script tag payload successfully blocked!');
    } else {
      logger.error('❌ Test 3 Failed: XSS payload allowed through.');
    }
  } catch (err) {
    logger.error(`Test 3 Error: ${err.message}`);
  }

  logger.info('--- WADPS Verification Tests Complete ---');
}

runTests();
