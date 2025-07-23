#!/usr/bin/env node

/**
 * Test script to verify error handling for missing environment variables
 * This script tests all API endpoints to ensure they return proper error responses
 * when environment variables are missing.
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'POST', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function runTests() {
  console.log('🧪 Testing API error handling for missing environment variables\n');
  
  // Test data
  const testData = {
    enrich: {
      rows: [{ email: 'test@example.com', name: 'Test User' }],
      fields: [{ name: 'companyName', displayName: 'Company Name', type: 'string' }],
      emailColumn: 'email'
    },
    generateFields: {
      prompt: 'I need company information'
    },
    scrape: {
      url: 'https://example.com'
    }
  };
  
  const tests = [
    {
      name: 'Enrich API',
      endpoint: '/api/enrich',
      method: 'POST',
      body: testData.enrich
    },
    {
      name: 'Generate Fields API',
      endpoint: '/api/generate-fields',
      method: 'POST',
      body: testData.generateFields
    },
    {
      name: 'Scrape API',
      endpoint: '/api/scrape',
      method: 'POST',
      body: testData.scrape
    }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    
    const result = await testEndpoint(test.endpoint, test.method, test.body);
    
    if (result.status === 0) {
      console.log(`❌ ${test.name}: Connection failed - ${result.data.error}`);
      allPassed = false;
      continue;
    }
    
    // Check if it's a server configuration error (500 status)
    if (result.status === 500 && result.data.code === 'MISSING_API_KEYS') {
      console.log(`✅ ${test.name}: Correctly returns server configuration error`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data.error}`);
      console.log(`   Code: ${result.data.code}`);
    } else if (result.success) {
      console.log(`✅ ${test.name}: API working (environment variables are configured)`);
      console.log(`   Status: ${result.status}`);
    } else {
      console.log(`⚠️  ${test.name}: Unexpected error response`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Response:`, result.data);
      allPassed = false;
    }
    
    console.log('');
  }
  
  if (allPassed) {
    console.log('🎉 All tests completed successfully!');
    console.log('\nNote: If environment variables are properly configured, APIs will work normally.');
    console.log('To test missing API key scenarios, temporarily rename your .env.local file.');
  } else {
    console.log('❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Check if we're running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with fetch support');
  console.log('Please run with: node test-error-handling.js');
  process.exit(1);
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});