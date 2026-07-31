//!/usr/bin/env node

const fetch = require('node-fetch');
const { exit } = require('process');

function log(message, emoji = '') {
  console.log(`${emoji} ${message}`);
}

async function testEndpoint(url, method, body, headers = {}) {
  const start = Date.now();
  
  try {
    const options = {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...headers
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const elapsed = Date.now() - start;
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    
    return {
      url,
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      data,
      error: response.ok ? undefined : `${response.status} ${response.statusText}`,
      elapsed,
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      statusCode: 0,
      data: null,
      error: error.message || String(error),
      elapsed: Date.now() - start,
    };
  }
}

async function main() {
  log('='.repeat(60), '');
  log('TESTING EXTERNAL API ENDPOINTS', '');
  log('='.repeat(60), '');
  log('', '');
  
  const baseUrl = 'http://localhost:9092';
  const authToken = 'admin:Glskd555545454';
  const authHeader = 'Basic ' + Buffer.from(authToken).toString('base64');
  
  const tests = [];
  
  log('1. Testing Swagger UI endpoint...');
  log('   Endpoint: /api/auth/external (for authentication test)', '');
  
  const externalAuthTest = await testEndpoint(
    `${baseUrl}/api/auth/external`,
    'POST',
    {
      client_id: 'lts_a7f_5202l',
      secret: 'k9Hp4$mQ!2vN6rT1',
    },
    {
      'Authorization': authHeader,
    }
  );
  tests.push(externalAuthTest);
  
  log('2. Testing Swagger UI (HTML response)...');
  
  const swaggerTest = await testEndpoint(
    `${baseUrl}/api/docs/`,
    'GET',
    null,
    {
      'Authorization': authHeader,
    }
  );
  tests.push(swaggerTest);
  
  log('3. Testing External API Token Endpoint...');
  
  const externalTokenTest = await testEndpoint(
    'https://heel-encourage-residential-baskets.trycloudflare.com/api/v1/auth/token',
    'POST',
    {
      client_id: 'lts_a7f_5202l',
      secret: 'k9Hp4$mQ!2vN6rT1',
    }
  );
  tests.push(externalTokenTest);
  
  log('', '');
  log('='.repeat(60), '');
  log('TEST RESULTS', '');
  log('='.repeat(60), '');
  
  tests.forEach((test, index) => {
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
        if (test.data.client_id) {
          log(`    Client ID: ${test.data.client_id}`, '');
        }
        if (test.data.expires_at) {
          log(`    Expires at: ${test.data.expires_at}`, '');
        }
        if (test.data.message && test.data.message.includes('Unauthorized')) {
          log('    Message: Swagger UI requires authentication', '');
        }
      } else {
        log(`  Response preview: ${JSON.stringify(test.data, null, 2).substring(0, 300)}...`, '');
      }
    }
  });
  
  const passedTests = tests.filter(t => t.status === 'success').length;
  const totalTests = tests.length;
  
  log('', '');
  log('='.repeat(60), '');
  log(`SUMMARY: ${passedTests}/${totalTests} tests passed`, '');
  
  if (passedTests === totalTests) {
    log('\n✅ All tests PASSED!', '');
    exit(0);
  } else {
    log('\n❌ Some tests FAILED!', '');
    exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  exit(1);
});
