import dotenv from 'dotenv';
import { conversationController } from './src/controllers/conversationController.js';

// Load environment variables
dotenv.config();

async function testConversationController() {
  try {
    console.log('Testing conversation controller...');
    
    // Test creating a thread
    const testUserId = '7bde12d3-1bba-43b3-b4b2-a2ab02b0b24e'; // Valid UUID format
    const testTitle = 'Test Thread';
    const testSummary = 'Test summary';
    
    console.log('Creating test thread...');
    const thread = await conversationController.createThread(testUserId, testTitle, testSummary);
    console.log('✅ Thread created:', thread);
    
    // Test adding a message
    console.log('Adding test message...');
    const message = await conversationController.addMessage(thread.id, 'Test message', 'user', {});
    console.log('✅ Message added:', message);
    
    // Test getting threads
    console.log('Getting threads...');
    const threads = await conversationController.getThreads(testUserId);
    console.log('✅ Threads retrieved:', threads.length);
    
    // Test getting specific thread
    console.log('Getting specific thread...');
    const specificThread = await conversationController.getThread(thread.id, testUserId);
    console.log('✅ Specific thread retrieved:', specificThread ? 'success' : 'not found');
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConversationController(); 