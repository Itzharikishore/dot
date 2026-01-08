const axios = require('axios');

// API base URL
const BASE_URL = 'http://localhost:5000/api';

// Test endpoints
const tests = [
  {
    name: 'Server Health',
    method: 'GET',
    url: '/',
    expected: 200
  },
  {
    name: 'Auth Register',
    method: 'POST',
    url: '/auth/register',
    data: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'therapist'
    },
    expected: 201
  },
  {
    name: 'Auth Login',
    method: 'POST',
    url: '/auth/login',
    data: {
      email: 'test@example.com',
      password: 'password123'
    },
    expected: 200
  },
  {
    name: 'Get Therapists',
    method: 'GET',
    url: '/therapists/list',
    expected: 401 // Should require auth
  },
  {
    name: 'Get Games',
    method: 'GET',
    url: '/games/list',
    expected: 401 // Should require auth
  },
  {
    name: 'Get Alerts',
    method: 'GET',
    url: '/alerts',
    expected: 401 // Should require auth
  }
];

async function runTests() {
  console.log('🧪 Testing API Connectivity...\n');
  
  let passed = 0;
  let failed = 0;
  let authToken = null;

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        timeout: 5000
      };

      if (test.data) {
        config.data = test.data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      if (authToken) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${authToken}`
        };
      }

      const response = await axios(config);
      
      // Store auth token from login
      if (test.name === 'Auth Login' && response.data.success) {
        authToken = response.data.data.token;
        console.log('🔑 Auth token received');
      }

      if (response.status === test.expected) {
        console.log(`✅ ${test.name}: ${response.status}`);
        passed++;
      } else {
        console.log(`⚠️  ${test.name}: Expected ${test.expected}, got ${response.status}`);
        failed++;
      }
    } catch (error) {
      if (error.response && error.response.status === test.expected) {
        console.log(`✅ ${test.name}: ${error.response.status} (Expected)`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (passed === tests.length) {
    console.log('\n🎉 All API connectivity tests passed!');
    console.log('🚀 Backend is ready for frontend connection.');
  } else {
    console.log('\n⚠️  Some tests failed. Check backend server.');
  }
}

// Run the tests
runTests().catch(console.error);
