/**
 * Example Usage of Gemini Test Cases
 * 
 * This file shows how to use the test cases and test runner in practice
 */

import { GeminiTestRunner } from './testRunner.js';
import { GEMINI_TEST_CASES } from './geminiTestCases.js';

/**
 * Example 1: Manual Testing
 * Test individual scenarios manually to verify behavior
 */
export async function manualTestingExample(geminiService, userId) {
  console.log('🔍 Manual Testing Example\n');

  // Test a goal creation request
  const goalTest = GEMINI_TEST_CASES.goals.create[0];
  console.log(`Testing: "${goalTest.input}"`);
  
  try {
    const response = await geminiService.processMessage(goalTest.input, userId);
    console.log('Response:', response);
    
    // Check if the response contains the expected goal creation
    if (response.message && response.message.includes('created a new goal')) {
      console.log('✅ Goal creation test PASSED');
    } else {
      console.log('❌ Goal creation test FAILED');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test a task creation request
  const taskTest = GEMINI_TEST_CASES.tasks.create[0];
  console.log(`Testing: "${taskTest.input}"`);
  
  try {
    const response = await geminiService.processMessage(taskTest.input, userId);
    console.log('Response:', response);
    
    if (response.message && response.message.includes('created a new task')) {
      console.log('✅ Task creation test PASSED');
    } else {
      console.log('❌ Task creation test FAILED');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

/**
 * Example 2: Automated Testing with Test Runner
 * Run comprehensive tests using the test runner
 */
export async function automatedTestingExample(geminiService, userId) {
  console.log('🤖 Automated Testing Example\n');

  const testRunner = new GeminiTestRunner(geminiService);

  // First, run a quick smoke test
  console.log('Running smoke test...');
  const smokeTestPassed = await testRunner.runSmokeTest(userId);

  if (smokeTestPassed) {
    console.log('\nSmoke test passed! Running full test suite...\n');
    
    // Run the full test suite
    const results = await testRunner.runAllTests(userId);
    
    // Generate a detailed report
    const report = testRunner.generateReport();
    
    console.log('\n📋 DETAILED REPORT');
    console.log('==================');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  } else {
    console.log('Smoke test failed. Check your Gemini service configuration.');
    return null;
  }
}

/**
 * Example 3: Testing Specific Categories
 * Test only specific types of operations
 */
export async function categoryTestingExample(geminiService, userId) {
  console.log('📂 Category Testing Example\n');

  const testRunner = new GeminiTestRunner(geminiService);

  // Test only goal operations
  console.log('Testing GOAL operations only...\n');
  await testRunner.runCategoryTests('goals', userId);
  testRunner.printResults();

  // Reset results for next test
  testRunner.results = { total: 0, passed: 0, failed: 0, details: [] };

  // Test only calendar operations
  console.log('\nTesting CALENDAR operations only...\n');
  await testRunner.runCategoryTests('calendar', userId);
  testRunner.printResults();
}

/**
 * Example 4: Edge Case Testing
 * Test ambiguous or complex scenarios
 */
export async function edgeCaseTestingExample(geminiService, userId) {
  console.log('⚠️  Edge Case Testing Example\n');

  const edgeCases = [
    "Add a goal to learn React and also create a task to practice coding",
    "Update my goal to exercise daily and also schedule a meeting tomorrow",
    "I want to delete my goal to learn React and also complete my task to review documents"
  ];

  for (const testInput of edgeCases) {
    console.log(`Testing edge case: "${testInput}"`);
    
    try {
      const response = await geminiService.processMessage(testInput, userId);
      console.log('Response:', response.message);
      
      // Check if the response handles the complexity appropriately
      if (response.message && response.message.length > 0) {
        console.log('✅ Edge case handled');
      } else {
        console.log('❌ Edge case not handled properly');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('---');
  }
}

/**
 * Example 5: Performance Testing
 * Test response times and reliability
 */
export async function performanceTestingExample(geminiService, userId) {
  console.log('⚡ Performance Testing Example\n');

  const testInputs = [
    "Add a goal to learn React",
    "Show my goals",
    "Add a task to review documents",
    "Schedule a meeting tomorrow at 2pm",
    "How are you today?"
  ];

  const results = [];

  for (const input of testInputs) {
    console.log(`Testing: "${input}"`);
    
    const startTime = Date.now();
    
    try {
      const response = await geminiService.processMessage(input, userId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        input,
        duration,
        success: true,
        responseLength: response.message ? response.message.length : 0
      });
      
      console.log(`✅ Completed in ${duration}ms`);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        input,
        duration,
        success: false,
        error: error.message
      });
      
      console.log(`❌ Failed in ${duration}ms: ${error.message}`);
    }
  }

  // Calculate performance metrics
  const successfulTests = results.filter(r => r.success);
  const avgDuration = successfulTests.length > 0 
    ? successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length 
    : 0;
  
  const successRate = (successfulTests.length / results.length) * 100;

  console.log('\n📊 PERFORMANCE METRICS');
  console.log('======================');
  console.log(`Average Response Time: ${avgDuration.toFixed(2)}ms`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successfulTests.length}`);
  console.log(`Failed: ${results.length - successfulTests.length}`);

  return results;
}

/**
 * Example 6: Integration Testing
 * Test the complete flow from user input to database action
 */
export async function integrationTestingExample(geminiService, userId) {
  console.log('🔗 Integration Testing Example\n');

  const integrationTests = [
    {
      name: "Goal Creation Flow",
      input: "Add a goal to learn React",
      expectedActions: ["Created goal: learn React"],
      expectedMessage: "created a new goal"
    },
    {
      name: "Task Creation Flow", 
      input: "Add a task to review documents",
      expectedActions: ["Created task: review documents"],
      expectedMessage: "created a new task"
    },
    {
      name: "Calendar Event Flow",
      input: "Schedule a meeting tomorrow at 2pm",
      expectedActions: ["Scheduled event: meeting"],
      expectedMessage: "scheduled an event"
    }
  ];

  for (const test of integrationTests) {
    console.log(`Testing: ${test.name}`);
    console.log(`Input: "${test.input}"`);
    
    try {
      const response = await geminiService.processMessage(test.input, userId);
      
      // Check if the response contains expected elements
      const hasExpectedMessage = response.message && response.message.toLowerCase().includes(test.expectedMessage);
      const hasExpectedActions = response.actions && response.actions.some(action => 
        test.expectedActions.some(expected => action.includes(expected))
      );
      
      if (hasExpectedMessage && hasExpectedActions) {
        console.log('✅ Integration test PASSED');
        console.log('Response:', response.message);
        console.log('Actions:', response.actions);
      } else {
        console.log('❌ Integration test FAILED');
        console.log('Response:', response);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('---');
  }
}

/**
 * Main function to run all examples
 */
export async function runAllExamples(geminiService, userId) {
  console.log('🚀 Running All Gemini Test Examples\n');
  console.log('=====================================\n');

  // Example 1: Manual Testing
  await manualTestingExample(geminiService, userId);
  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Automated Testing
  await automatedTestingExample(geminiService, userId);
  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Category Testing
  await categoryTestingExample(geminiService, userId);
  console.log('\n' + '='.repeat(50) + '\n');

  // Example 4: Edge Case Testing
  await edgeCaseTestingExample(geminiService, userId);
  console.log('\n' + '='.repeat(50) + '\n');

  // Example 5: Performance Testing
  await performanceTestingExample(geminiService, userId);
  console.log('\n' + '='.repeat(50) + '\n');

  // Example 6: Integration Testing
  await integrationTestingExample(geminiService, userId);

  console.log('\n🎉 All examples completed!');
}

/**
 * Usage instructions:
 * 
 * 1. Import your GeminiService
 * 2. Call any of the example functions:
 * 
 * import { GeminiService } from './geminiService.js';
 * import { runAllExamples } from './exampleTestUsage.js';
 * 
 * const geminiService = new GeminiService();
 * await runAllExamples(geminiService, userId);
 * 
 * Or run individual examples:
 * await manualTestingExample(geminiService, userId);
 * await automatedTestingExample(geminiService, userId);
 * await performanceTestingExample(geminiService, userId);
 */ 