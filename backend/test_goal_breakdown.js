// Test script for goal breakdown API endpoint
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000/api';

async function testGoalBreakdown() {
  try {
    console.log('Testing goal breakdown API...');
    
    const response = await fetch(`${API_BASE_URL}/goals/generate-breakdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token', // You'll need a real token for testing
      },
      body: JSON.stringify({
        title: 'Learn React Native Development',
        description: 'Master mobile app development with React Native by building real projects and understanding core concepts.',
      }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const breakdown = await response.json();
    console.log('Success! Goal breakdown generated:');
    console.log(JSON.stringify(breakdown, null, 2));
  } catch (error) {
    console.error('Error testing goal breakdown:', error);
  }
}

testGoalBreakdown(); 