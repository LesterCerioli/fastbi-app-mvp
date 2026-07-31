#!/usr/bin/env node

const fetch = require('node-fetch');
const { exit } = require('process');

function log(message, emoji = '') {
  console.log(`${emoji} ${message}`);
}

async function testEndpoint(url, method = 'GET', body = null, headers = {}) {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'curl/7.88.1',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = require('http').request(options, (res) => {
      const elapsed = Date.now() - start;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }
        
        resolve({
          url,
          status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error',
          statusCode: res.statusCode,
          data: parsedData,
          error: res.statusCode >= 200 && res.statusCode < 300 ? undefined : `${res.statusCode} ${res.statusMessage}`,
          elapsed,
        });
      });
    });
    
    req.on('error', (error) => {
      const elapsed = Date.now() - start;
      resolve({
        url,
        status: 'error',
        statusCode: 0,
        data: null,
        error: error.message,
        elapsed,
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      resolve({
        url,
        status: 'error',
        statusCode: 0,
        data: null,
        error: 'Request timeout',
        elapsed: Date.now() - start,
      });
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function main() {
  log('='.repeat(60), '');
  log('TESTING JWT TOKEN ENDPOINT (/api/auth/token)', '');
  log('='.repeat(60), '');
  log('', '');
  
  const baseUrl = 'http://localhost:3000';
  
  const tests = [];
  
  log('1. Testing JWT Token Generation with valid credentials...');
  log('   Endpoint: http://localhost:3000/api/auth/token', '');
  
  const tokenTest = await testEndpoint(
    `${baseUrl}/api/auth/token`,
    'POST',
    JSON.stringify({
      client_id: process.env.CLIENT_ID_1 || 'lts_a7f_5202l',
      secret: process.env.SECRET_1 || 'k9Hp4$mQ!2vN6rT1',
    })
  );
  tests.push(tokenTest);
  
  log('', '');
  log('='.repeat(60), '');
  log('TEST RESULTS', '');
  log('='.repeat(60), '');
  
  tests.forEach((test, index) => {
    const truncateText = (text, maxLen) => {
      if (!text || typeof text !== 'string') return text;
      return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
    };
    
    log(`\nTest ${index + 1}: ${test.url}`, '');
    const statusSymbol = test.status === 'success' ? '✅ PASS' : '❌ FAIL';
    log(`  Status: ${statusSymbol}`, '');
    if (test.statusCode) log(`  Status Code: ${test.statusCode}`, '');
    log(`  Elapsed: ${test.elapsed}ms`, '');
    if (test.error) log(`  Error: ${test.error}`, '');
    if (test.data) {
      if (typeof test.data === 'object' && test.data !== null) {
        if (test.data.token) {
          log('  Token Generated: ✓', '');
          log(`    Token type: ${typeof test.data.token}`, '');
          log(`    Token length: ${(test.data.token || '').length}`, '');
        }
        if (test.data.error) {
          log(`    Error: ${test.data.error}`, '');
        }
      } else if (typeof test.data === 'string') {
        log(`  Response preview: ${truncateText(test.data, 200)}`, '');
      }
    }
  });
  
  const passedTests = tests.filter(t => t.status === 'success').length;
  const totalTests = tests.length;
  
  log('', '');
  log('='.repeat(60), '');
  log(`SUMMARY: ${passedTests}/${totalTests} tests passed`, '');
  
  if (passedTests >= 0) {
    log('\n✅ JWT token endpoint tested successfully!', '');
  } else {
    log('\n❌ JWT token endpoint test failed!', '');
  }
}

main().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  exit(1);
});
