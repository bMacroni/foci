import { getGoalTitlesForUser } from './src/controllers/goalsController.js';

// Mock test function
async function testGoalTitles() {
  console.log('Testing getGoalTitlesForUser function...');
  
  // Mock data
  const mockUserId = 'test-user-id';
  const mockToken = 'mock-token';
  
  // Test cases
  const testCases = [
    {
      name: 'No filters',
      args: {},
      expected: 'Should return all goal titles'
    },
    {
      name: 'Search filter',
      args: { search: 'fitness' },
      expected: 'Should return goals with "fitness" in title'
    },
    {
      name: 'Category filter',
      args: { category: 'health' },
      expected: 'Should return goals in health category'
    },
    {
      name: 'Priority filter',
      args: { priority: 'high' },
      expected: 'Should return high priority goals'
    },
    {
      name: 'Status filter',
      args: { status: 'in_progress' },
      expected: 'Should return in-progress goals'
    },
    {
      name: 'Due date filter',
      args: { due_date: '2024-12-31' },
      expected: 'Should return goals due on 2024-12-31'
    },
    {
      name: 'Multiple filters',
      args: { 
        search: 'learn',
        category: 'career',
        priority: 'medium'
      },
      expected: 'Should return career goals with "learn" in title and medium priority'
    }
  ];

  console.log('\nTest cases:');
  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}: ${testCase.expected}`);
  });

  console.log('\nNote: This is a mock test. To run actual tests, you would need:');
  console.log('1. A valid Supabase connection');
  console.log('2. A valid user ID and token');
  console.log('3. Some test data in the goals table');
  console.log('\nThe function signature is: getGoalTitlesForUser(userId, token, args)');
  console.log('Returns: Array of goal titles or error object');
}

// Run the test
testGoalTitles().catch(console.error); 