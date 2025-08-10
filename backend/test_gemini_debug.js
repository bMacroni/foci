// Test script for Gemini debugging
// Run this with: node test_gemini_debug.js

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api'; // Adjust port if needed
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual test token

const testMessages = [
  "What goals do I have?",
  "Show me my tasks",
  "Create a task to clean the kitchen",
  "What's on my calendar today?",
  "I want to learn React Native"
];

async function testGeminiDebug() {
  console.log('🧪 [TEST] Starting Gemini debugging tests...\n');
  
  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i];
    console.log(`🧪 [TEST] Test ${i + 1}: "${message}"`);
    console.log('🧪 [TEST] Sending request to backend...\n');
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        body: JSON.stringify({
          message: message,
          threadId: null
        })
      });
      
      const result = await response.json();
      
      console.log(`🧪 [TEST] Response status: ${response.status}`);
      console.log(`🧪 [TEST] Response message: ${result.message}`);
      console.log(`🧪 [TEST] Actions count: ${result.actions ? result.actions.length : 0}`);
      if (result.actions && result.actions.length > 0) {
        console.log(`🧪 [TEST] Actions: ${JSON.stringify(result.actions, null, 2)}`);
      }
      console.log('🧪 [TEST] --- End of test ---\n');
      
    } catch (error) {
      console.error(`🧪 [TEST] Error in test ${i + 1}:`, error);
      console.log('🧪 [TEST] --- End of test ---\n');
    }
  }
  
  console.log('🧪 [TEST] All tests completed. Check your backend console for detailed debugging output.');
}

// Instructions for running the test
console.log('📋 [INSTRUCTIONS] To run this test:');
console.log('1. Make sure your backend server is running');
console.log('2. Replace TEST_TOKEN with a valid JWT token');
console.log('3. Run: node test_gemini_debug.js');
console.log('4. Check your backend console for detailed debugging output');
console.log('5. The debugging logs will show:');
console.log('   - Incoming requests and their content');
console.log('   - System prompts sent to Gemini');
console.log('   - Function calls made by Gemini');
console.log('   - Function execution results');
console.log('   - Final responses sent to frontend');
console.log('\n');

// Uncomment the line below to run the test
// testGeminiDebug(); 