const axios = require('axios');

(async () => {
  const base = 'http://localhost:5000';
  const email = 'test+api@dot.local';

  try {
    const reg = await axios.post(`${base}/api/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email,
      password: 'Password123'
    }, { timeout: 5000 });
    console.log('Register response:', reg.data);
  } catch (err) {
    if (err.response) console.log('Register error response:', err.response.data);
    else console.error('Register error:', err.message);
  }

  try {
    // Use development debug endpoint to get token directly
    const res = await axios.post(`${base}/api/auth/forgot-password-debug`, { email }, { timeout: 5000 });
    console.log('Forgot-password debug response:', res.data);
  } catch (err) {
    if (err.response) console.log('Forgot error response:', err.response.data);
    else console.error('Forgot error:', err.message);
  }

  process.exit(0);
})();