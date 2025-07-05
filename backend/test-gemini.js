import dotenv from 'dotenv';
dotenv.config();

import GeminiService from './src/utils/geminiService.js';

async function testGemini() {
  console.log('🧪 Testing Gemini AI Integration...\n');
  
  const geminiService = new GeminiService();
  
  if (!geminiService.enabled) {
    console.log('❌ Gemini AI is not enabled. Please set GOOGLE_AI_API_KEY in your .env file.');
    return;
  }
  
  console.log('✅ Gemini AI is enabled!\n');
  
  // Test basic conversation
  console.log('Testing basic conversation...');
  try {
    const response = await geminiService.processMessage("Hello! How can you help me with productivity?", "test-user");
    console.log('Response:', response.message);
    console.log('✅ Basic conversation test passed!\n');
  } catch (error) {
    console.log('❌ Basic conversation test failed:', error.message);
  }
  
  // Test goal creation
  console.log('Testing goal creation...');
  try {
    const response = await geminiService.processMessage("Add a goal to learn React", "test-user");
    console.log('Response:', response.message);
    console.log('✅ Goal creation test passed!\n');
  } catch (error) {
    console.log('❌ Goal creation test failed:', error.message);
  }
  
  // Test task creation with date
  console.log('Testing task creation with date...');
  try {
    const response = await geminiService.processMessage("Add a task to review documents by next week", "test-user");
    console.log('Response:', response.message);
    console.log('✅ Task creation with date test passed!\n');
  } catch (error) {
    console.log('❌ Task creation with date test failed:', error.message);
  }
  
  console.log('🎉 Gemini AI integration test completed!');
}

testGemini().catch(console.error); 