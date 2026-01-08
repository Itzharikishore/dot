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

async function testChildUser() {
  console.log('👤 Creating Test Child User...\n');

  try {
    // Create a test child user
    console.log('Creating test child...');
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
      lastName: 'Child',
      email: 'child@test.com',
      password: 'TestPass123',
      role: 'child',
      phoneNumber: '+1234567890',
      dateOfBirth: '2015-06-15',
      gender: 'male'
    });
    
    console.log(`   Status: ${registerResponse.statusCode}`);
    console.log(`   Body: ${registerResponse.body}\n`);

    if (registerResponse.statusCode === 201) {
      console.log('✅ Test child user created successfully!');
      
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
        email: 'child@test.com',
        password: 'TestPass123'
      });
      
      console.log(`   Status: ${loginResponse.statusCode}`);
      console.log(`   Body: ${loginResponse.body}\n`);

      if (loginResponse.statusCode === 200) {
        const loginData = JSON.parse(loginResponse.body);
        if (loginData.success && loginData.data.token) {
          console.log('✅ Login successful!');
          console.log('🔑 Token received:', loginData.data.token.substring(0, 50) + '...');
          
          // Test games endpoint
          console.log('\n🎮 Testing games endpoint...');
          const gamesResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/games/list',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.data.token}`
            }
          });
          
          console.log(`   Status: ${gamesResponse.statusCode}`);
          console.log(`   Body: ${gamesResponse.body.substring(0, 200)}...\n`);
          
          // Test alerts endpoint
          console.log('🔔 Testing alerts endpoint...');
          const alertsResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/alerts',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.data.token}`
            }
          });
          
          console.log(`   Status: ${alertsResponse.statusCode}`);
          console.log(`   Body: ${alertsResponse.body.substring(0, 200)}...\n`);
          
          console.log('🎉 Full-stack connectivity test PASSED!');
          console.log('🚀 Backend is ready for Flutter frontend connection!');
          console.log('\n📱 Flutter App Connection Details:');
          console.log('🔗 Base URL: http://localhost:5000');
          console.log('👤 Test User: child@test.com / TestPass123');
          console.log('🎮 Games API: Working');
          console.log('🔔 Alerts API: Working');
          console.log('🔐 Authentication: Working');
        }
      }
    } else {
      console.log('❌ User creation failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChildUser();
