/**
 * Test Runner for Gemini AI Assistant
 * 
 * This utility helps validate that the AI assistant correctly handles various scenarios
 */

import { GEMINI_TEST_CASES, validateTestCase } from './geminiTestCases.js';

export class GeminiTestRunner {
  constructor(geminiService) {
    this.geminiService = geminiService;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  /**
   * Run all test cases
   */
  async runAllTests(userId) {
    console.log('🧪 Starting Gemini AI Assistant Test Suite...\n');
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };

    // Test Goals
    await this.runCategoryTests('goals', userId);
    
    // Test Tasks
    await this.runCategoryTests('tasks', userId);
    
    // Test Calendar
    await this.runCategoryTests('calendar', userId);
    
    // Test General
    await this.runGeneralTests(userId);
    
    // Test Edge Cases
    await this.runEdgeCaseTests(userId);

    this.printResults();
    return this.results;
  }

  /**
   * Run tests for a specific category (goals, tasks, calendar)
   */
  async runCategoryTests(category, userId) {
    console.log(`📋 Testing ${category.toUpperCase()} operations...`);
    
    const operations = ['create', 'read', 'update', 'delete', 'complete'];
    
    for (const operation of operations) {
      if (GEMINI_TEST_CASES[category] && GEMINI_TEST_CASES[category][operation]) {
        console.log(`  🔄 Testing ${operation} operations...`);
        
        for (const testCase of GEMINI_TEST_CASES[category][operation]) {
          await this.runSingleTest(testCase, category, operation, userId);
        }
      }
    }
  }

  /**
   * Run general conversation tests
   */
  async runGeneralTests(userId) {
    console.log('💬 Testing general conversation...');
    
    for (const testCase of GEMINI_TEST_CASES.general) {
      await this.runSingleTest(testCase, 'general', 'help', userId);
    }
  }

  /**
   * Run edge case tests
   */
  async runEdgeCaseTests(userId) {
    console.log('⚠️  Testing edge cases...');
    
    for (const testCase of GEMINI_TEST_CASES.edgeCases) {
      await this.runSingleTest(testCase, 'edge', 'mixed', userId);
    }
  }

  /**
   * Run a single test case
   */
  async runSingleTest(testCase, category, operation, userId) {
    this.results.total++;
    
    try {
      console.log(`    Testing: "${testCase.input}"`);
      
      // Process the message through Gemini
      const actualResponse = await this.geminiService.processMessage(testCase.input, userId);
      
      // Extract the classification from the response
      // Note: You'll need to modify this based on your actual response structure
      const actualClassification = {
        type: actualResponse.type || 'general',
        operation: actualResponse.operation || 'help',
        confidence: actualResponse.confidence || 'medium',
        details: actualResponse.details || {}
      };
      
      // Validate the response
      const validation = validateTestCase(testCase.input, testCase.expected, actualClassification);
      
      if (validation.passed) {
        this.results.passed++;
        console.log(`    ✅ PASSED`);
      } else {
        this.results.failed++;
        console.log(`    ❌ FAILED: ${validation.issues.join(', ')}`);
      }
      
      this.results.details.push({
        category,
        operation,
        input: testCase.input,
        expected: testCase.expected,
        actual: actualClassification,
        passed: validation.passed,
        issues: validation.issues
      });
      
    } catch (error) {
      this.results.failed++;
      console.log(`    ❌ ERROR: ${error.message}`);
      
      this.results.details.push({
        category,
        operation,
        input: testCase.input,
        expected: testCase.expected,
        actual: null,
        passed: false,
        issues: [`Error: ${error.message}`]
      });
    }
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 TEST RESULTS');
    console.log('===============');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`\nInput: "${test.input}"`);
          console.log(`Expected: ${JSON.stringify(test.expected, null, 2)}`);
          console.log(`Actual: ${JSON.stringify(test.actual, null, 2)}`);
          console.log(`Issues: ${test.issues.join(', ')}`);
        });
    }
  }

  /**
   * Run a quick smoke test with a few key scenarios
   */
  async runSmokeTest(userId) {
    console.log('🚀 Running Smoke Test...\n');
    
    const smokeTests = [
      {
        input: "Add a goal to learn React",
        expected: { type: "goal", operation: "create", confidence: "high" }
      },
      {
        input: "Show my goals",
        expected: { type: "goals", operation: "read", confidence: "high" }
      },
      {
        input: "Add a task to review documents",
        expected: { type: "task", operation: "create", confidence: "high" }
      },
      {
        input: "Schedule a meeting tomorrow at 2pm",
        expected: { type: "event", operation: "create", confidence: "high" }
      },
      {
        input: "How are you today?",
        expected: { type: "general", operation: "help", confidence: "high" }
      }
    ];

    let passed = 0;
    let total = smokeTests.length;

    for (const test of smokeTests) {
      try {
        console.log(`Testing: "${test.input}"`);
        const response = await this.geminiService.processMessage(test.input, userId);
        
        const actualClassification = {
          type: response.type || 'general',
          operation: response.operation || 'help',
          confidence: response.confidence || 'medium'
        };
        
        const validation = validateTestCase(test.input, test.expected, actualClassification);
        
        if (validation.passed) {
          console.log('  ✅ PASSED');
          passed++;
        } else {
          console.log(`  ❌ FAILED: ${validation.issues.join(', ')}`);
        }
      } catch (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
      }
    }

    console.log(`\nSmoke Test Results: ${passed}/${total} passed`);
    return passed === total;
  }

  /**
   * Generate a test report
   */
  generateReport() {
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(1)
      },
      byCategory: {},
      failedTests: this.results.details.filter(test => !test.passed),
      recommendations: []
    };

    // Group by category
    this.results.details.forEach(test => {
      if (!report.byCategory[test.category]) {
        report.byCategory[test.category] = { total: 0, passed: 0, failed: 0 };
      }
      report.byCategory[test.category].total++;
      if (test.passed) {
        report.byCategory[test.category].passed++;
      } else {
        report.byCategory[test.category].failed++;
      }
    });

    // Generate recommendations
    if (this.results.failed > 0) {
      report.recommendations.push('Review and improve Gemini prompts for failed test cases');
    }
    
    Object.keys(report.byCategory).forEach(category => {
      const cat = report.byCategory[category];
      if (cat.failed > 0) {
        report.recommendations.push(`Focus on improving ${category} classification accuracy`);
      }
    });

    return report;
  }
}

/**
 * Example usage:
 * 
 * const testRunner = new GeminiTestRunner(geminiService);
 * 
 * // Run smoke test first
 * const smokeTestPassed = await testRunner.runSmokeTest(userId);
 * 
 * if (smokeTestPassed) {
 *   // Run full test suite
 *   const results = await testRunner.runAllTests(userId);
 *   const report = testRunner.generateReport();
 *   console.log('Test Report:', report);
 * }
 */ 