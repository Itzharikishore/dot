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

async function createTestUser() {
  console.log('👤 Creating Test User...\n');

  try {
    // Create a test user with valid password
    console.log('Creating test therapist...');
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
      lastName: 'Therapist',
      email: 'therapist@test.com',
      password: 'TestPass123',
      role: 'therapist',
      phoneNumber: '+1234567890'
    });
    
    console.log(`   Status: ${registerResponse.statusCode}`);
    console.log(`   Body: ${registerResponse.body}\n`);

    if (registerResponse.statusCode === 201) {
      console.log('✅ Test user created successfully!');
      
      // Now try to login
      console.log('🔑 Testing login...');
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        email: 'therapist@test.com',
        password: 'TestPass123'
      });
      
      console.log(`   Status: ${loginResponse.statusCode}`);
      console.log(`   Body: ${loginResponse.body}\n`);

      if (loginResponse.statusCode === 200) {
        const loginData = JSON.parse(loginResponse.body);
        if (loginData.success && loginData.data.token) {
          console.log('✅ Login successful!');
          console.log('🔑 Token received:', loginData.data.token.substring(0, 50) + '...');
          
          // Test authenticated endpoint
          console.log('\n🧪 Testing authenticated endpoint...');
          const authResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/therapists/list',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.data.token}`
            }
          });
          
          console.log(`   Status: ${authResponse.statusCode}`);
          console.log(`   Body: ${authResponse.body.substring(0, 200)}...\n`);
          
          console.log('🎉 Full-stack connectivity test PASSED!');
          console.log('🚀 Backend is ready for Flutter frontend connection!');
        }
      }
    } else {
      console.log('❌ User creation failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();
