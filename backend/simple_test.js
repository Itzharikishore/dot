const http = require('http');

// Test function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test 1: Server health
    console.log('1. Testing server health...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api',
      method: 'GET'
    });
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Body: ${healthResponse.body.substring(0, 100)}...\n`);

    // Test 2: Therapists endpoint (should require auth)
    console.log('2. Testing therapists endpoint...');
    const therapistsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/therapists/list',
      method: 'GET'
    });
    console.log(`   Status: ${therapistsResponse.statusCode} (Expected: 401)`);
    console.log(`   Body: ${therapistsResponse.body.substring(0, 100)}...\n`);

    // Test 3: Games endpoint (should require auth)
    console.log('3. Testing games endpoint...');
    const gamesResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/games/list',
      method: 'GET'
    });
    console.log(`   Status: ${gamesResponse.statusCode} (Expected: 401)`);
    console.log(`   Body: ${gamesResponse.body.substring(0, 100)}...\n`);

    // Test 4: Registration endpoint
    console.log('4. Testing registration endpoint...');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'therapist'
    });
    console.log(`   Status: ${registerResponse.statusCode}`);
    console.log(`   Body: ${registerResponse.body.substring(0, 200)}...\n`);

    console.log('✅ API tests completed!');
    console.log('🚀 Backend is running and responding to requests.');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();
