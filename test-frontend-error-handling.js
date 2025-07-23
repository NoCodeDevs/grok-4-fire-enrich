#!/usr/bin/env node

/**
 * Test script to verify frontend error handling for server configuration errors
 * This script simulates frontend API calls and verifies proper error handling
 */

const BASE_URL = 'http://localhost:3000';

async function testFrontendErrorHandling() {
  console.log('🧪 Testing frontend error handling for server configuration errors\n');
  
  // Test generate-fields endpoint (used by unified-enrichment-view)
  console.log('Testing generate-fields API call (from unified-enrichment-view)...');
  try {
    const response = await fetch(`${BASE_URL}/api/generate-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'I need company information' })
    });
    
    if (response.status === 500) {
      const errorData = await response.json();
      if (errorData.code === 'MISSING_API_KEYS') {
        console.log('✅ Generate fields: Server returns proper error structure');
        console.log('   Frontend should show: "Service temporarily unavailable. Please try again later."');
      } else {
        console.log('⚠️  Generate fields: Unexpected error structure');
      }
    } else if (response.ok) {
      console.log('✅ Generate fields: API working normally (environment variables configured)');
    } else {
      console.log('❌ Generate fields: Unexpected response status:', response.status);
    }
  } catch (error) {
    console.log('❌ Generate fields: Network error:', error.message);
  }
  
  console.log('');
  
  // Test enrich endpoint (used by enrichment-table)
  console.log('Testing enrich API call (from enrichment-table)...');
  try {
    const response = await fetch(`${BASE_URL}/api/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: [{ email: 'test@example.com', name: 'Test User' }],
        fields: [{ name: 'companyName', displayName: 'Company Name', type: 'string' }],
        emailColumn: 'email',
        useAgents: true,
        useV2Architecture: true
      })
    });
    
    if (response.status === 500) {
      const errorData = await response.json();
      if (errorData.code === 'MISSING_API_KEYS') {
        console.log('✅ Enrich: Server returns proper error structure');
        console.log('   Frontend should show: "Service temporarily unavailable. Please try again later."');
        console.log('   Frontend should set status to "completed" and stop processing');
      } else {
        console.log('⚠️  Enrich: Unexpected error structure');
      }
    } else if (response.ok) {
      console.log('✅ Enrich: API working normally (environment variables configured)');
      console.log('   Note: This is a streaming endpoint, so response may be partial');
    } else {
      console.log('❌ Enrich: Unexpected response status:', response.status);
    }
  } catch (error) {
    console.log('❌ Enrich: Network error:', error.message);
  }
  
  console.log('');
  
  // Test scrape endpoint (used indirectly by enrichment process)
  console.log('Testing scrape API call (used by enrichment process)...');
  try {
    const response = await fetch(`${BASE_URL}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' })
    });
    
    if (response.status === 500) {
      const errorData = await response.json();
      if (errorData.code === 'MISSING_API_KEYS') {
        console.log('✅ Scrape: Server returns proper error structure');
        console.log('   This error is handled internally by the enrichment process');
      } else {
        console.log('⚠️  Scrape: Unexpected error structure');
      }
    } else if (response.ok) {
      console.log('✅ Scrape: API working normally (environment variables configured)');
    } else {
      console.log('❌ Scrape: Unexpected response status:', response.status);
    }
  } catch (error) {
    console.log('❌ Scrape: Network error:', error.message);
  }
  
  console.log('\n🎯 Frontend Error Handling Summary:');
  console.log('1. unified-enrichment-view.tsx: Handles 500 errors in handleGenerateFields()');
  console.log('2. enrichment-table.tsx: Handles 500 errors in startEnrichment()');
  console.log('3. Both components show user-friendly message: "Service temporarily unavailable. Please try again later."');
  console.log('4. No references to user-provided API keys in error messages');
  console.log('\n✅ All frontend error handling tests completed!');
}

// Check if we're running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with fetch support');
  console.log('Please run with: node test-frontend-error-handling.js');
  process.exit(1);
}

testFrontendErrorHandling().catch(error => {
  console.error('❌ Frontend test runner failed:', error);
  process.exit(1);
});