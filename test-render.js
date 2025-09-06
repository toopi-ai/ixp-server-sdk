// Simple test script to verify the updated rendering functionality
const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000/ixp';
const TEST_INTENT = {
  name: 'test-intent',
  parameters: {}
};
const TEST_OPTIONS = {
  theme: {
    primaryColor: '#3498db',
    secondaryColor: '#2ecc71'
  },
  apiBase: API_BASE
};

// Test functions
async function testRenderEndpoint() {
  console.log('\n🧪 Testing /render endpoint (JSON response)...');
  try {
    const response = await axios.post(`${API_BASE}/render`, {
      intent: TEST_INTENT,
      options: TEST_OPTIONS
    });
    console.log('✅ /render endpoint response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error testing /render endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testRenderUiEndpoint() {
  console.log('\n🧪 Testing /render-ui endpoint (HTML response)...');
  try {
    const response = await axios.post(`${API_BASE}/render-ui`, {
      intent: TEST_INTENT,
      options: TEST_OPTIONS
    }, {
      responseType: 'text'
    });
    console.log(`✅ /render-ui endpoint returned HTML (${response.data.length} bytes)`);
    console.log('HTML preview:', response.data.substring(0, 200) + '...');
    return response.data;
  } catch (error) {
    console.error('❌ Error testing /render-ui endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testRenderJsonEndpoint() {
  console.log('\n🧪 Testing /render-json endpoint (Enhanced JSON response)...');
  try {
    const response = await axios.post(`${API_BASE}/render-json`, {
      intent: TEST_INTENT,
      options: TEST_OPTIONS
    });
    console.log('✅ /render-json endpoint response structure:');
    const keys = Object.keys(response.data);
    console.log(keys.map(key => `  - ${key}: ${typeof response.data[key]}`).join('\n'));
    return response.data;
  } catch (error) {
    console.error('❌ Error testing /render-json endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testComponentsRenderEndpoint() {
  console.log('\n🧪 Testing /components/render endpoint...');
  
  // Test JSON response
  try {
    const response = await axios.post(`${API_BASE}/components/render`, {
      componentName: 'test-component',
      props: { message: 'Hello from test!' },
      options: TEST_OPTIONS
    });
    console.log('✅ /components/render endpoint (JSON) response structure:');
    const keys = Object.keys(response.data);
    console.log(keys.map(key => `  - ${key}: ${typeof response.data[key]}`).join('\n'));
  } catch (error) {
    console.error('❌ Error testing /components/render endpoint (JSON):', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test HTML response
  try {
    const response = await axios.post(`${API_BASE}/components/render`, {
      componentName: 'test-component',
      props: { message: 'Hello from test!' },
      options: TEST_OPTIONS
    }, {
      headers: {
        'Accept': 'text/html'
      },
      responseType: 'text'
    });
    console.log(`✅ /components/render endpoint (HTML) returned HTML (${response.data.length} bytes)`);
    console.log('HTML preview:', response.data.substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ Error testing /components/render endpoint (HTML):', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting IXP Server SDK rendering tests...');
  
  try {
    await testRenderEndpoint();
    await testRenderUiEndpoint();
    await testRenderJsonEndpoint();
    await testComponentsRenderEndpoint();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runAllTests();