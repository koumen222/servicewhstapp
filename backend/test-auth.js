import axios from 'axios';

async function testAuth() {
  try {
    // Test register
    console.log('Testing registration...');
    const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
      email: 'test2@example.com',
      name: 'Test User 2',
      password: 'password123'
    });
    console.log('Register success:', registerResponse.data);

    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login success:', loginResponse.data);

    // Test instances with token
    console.log('\nTesting instances with token...');
    const token = loginResponse.data.token;
    const instancesResponse = await axios.get('http://localhost:3001/api/instances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Instances success:', instancesResponse.data);

  } catch (error) {
    console.error('Full error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testAuth();
