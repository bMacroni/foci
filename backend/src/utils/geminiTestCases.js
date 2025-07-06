/**
 * Test Cases for Gemini AI Assistant
 * 
 * This file contains comprehensive test cases to validate that the AI assistant
 * correctly classifies requests and extracts the right details for different scenarios.
 */

export const GEMINI_TEST_CASES = {
  // ===== GOAL OPERATIONS =====
  goals: {
    create: [
      {
        input: "Add a goal to learn React",
        expected: {
          type: "goal",
          operation: "create",
          confidence: "high",
          details: {
            title: "learn React",
            targetDate: "next month"
          }
        }
      },
      {
        input: "Create a goal to exercise daily by next week",
        expected: {
          type: "goal",
          operation: "create",
          confidence: "high",
          details: {
            title: "exercise daily",
            targetDate: "next week"
          }
        }
      },
      {
        input: "Please add the following goals: Prepare for Kindergarten, Save money",
        expected: {
          type: "goals",
          operation: "create",
          confidence: "high",
          details: {
            goals: [
              { title: "Prepare for Kindergarten", targetDate: "next month" },
              { title: "Save money", targetDate: "next month" }
            ]
          }
        }
      },
      {
        input: "I want to set a goal to read 20 books this year",
        expected: {
          type: "goal",
          operation: "create",
          confidence: "high",
          details: {
            title: "read 20 books this year",
            targetDate: "next month"
          }
        }
      }
    ],
    
    read: [
      {
        input: "Show my goals",
        expected: {
          type: "goals",
          operation: "read",
          confidence: "high"
        }
      },
      {
        input: "What goals do I have?",
        expected: {
          type: "goals",
          operation: "read",
          confidence: "high"
        }
      },
      {
        input: "List my goals",
        expected: {
          type: "goals",
          operation: "read",
          confidence: "high"
        }
      }
    ],
    
    update: [
      {
        input: "Update my goal to exercise daily with a new target date of next month",
        expected: {
          type: "goal",
          operation: "update",
          confidence: "high",
          details: {
            title: "exercise daily",
            targetDate: "next month"
          }
        }
      },
      {
        input: "Change my goal to learn React to be completed by December",
        expected: {
          type: "goal",
          operation: "update",
          confidence: "high",
          details: {
            title: "learn React",
            targetDate: "December"
          }
        }
      }
    ],
    
    delete: [
      {
        input: "Delete my goal to learn React",
        expected: {
          type: "goal",
          operation: "delete",
          confidence: "high",
          details: {
            title: "learn React"
          }
        }
      },
      {
        input: "Remove the goal about exercising",
        expected: {
          type: "goal",
          operation: "delete",
          confidence: "high",
          details: {
            title: "exercising"
          }
        }
      }
    ],
    
    complete: [
      {
        input: "Complete my goal to learn React",
        expected: {
          type: "goal",
          operation: "complete",
          confidence: "high",
          details: {
            title: "learn React"
          }
        }
      },
      {
        input: "Mark my exercise goal as done",
        expected: {
          type: "goal",
          operation: "complete",
          confidence: "high",
          details: {
            title: "exercise"
          }
        }
      }
    ]
  },

  // ===== TASK OPERATIONS =====
  tasks: {
    create: [
      {
        input: "Add a task to review documents",
        expected: {
          type: "task",
          operation: "create",
          confidence: "high",
          details: {
            title: "review documents",
            dueDate: "next week"
          }
        }
      },
      {
        input: "Create a task to call the client by Friday",
        expected: {
          type: "task",
          operation: "create",
          confidence: "high",
          details: {
            title: "call the client",
            dueDate: "Friday"
          }
        }
      },
      {
        input: "I need to schedule a task to buy groceries tomorrow",
        expected: {
          type: "task",
          operation: "create",
          confidence: "high",
          details: {
            title: "buy groceries",
            dueDate: "tomorrow"
          }
        }
      }
    ],
    
    read: [
      {
        input: "Show my tasks",
        expected: {
          type: "tasks",
          operation: "read",
          confidence: "high"
        }
      },
      {
        input: "What tasks do I have?",
        expected: {
          type: "tasks",
          operation: "read",
          confidence: "high"
        }
      }
    ],
    
    update: [
      {
        input: "Update my task to review documents with a new due date of tomorrow",
        expected: {
          type: "task",
          operation: "update",
          confidence: "high",
          details: {
            title: "review documents",
            dueDate: "tomorrow"
          }
        }
      }
    ],
    
    delete: [
      {
        input: "Delete my task to review documents",
        expected: {
          type: "task",
          operation: "delete",
          confidence: "high",
          details: {
            title: "review documents"
          }
        }
      }
    ],
    
    complete: [
      {
        input: "Complete my task to review documents",
        expected: {
          type: "task",
          operation: "complete",
          confidence: "high",
          details: {
            title: "review documents"
          }
        }
      }
    ]
  },

  // ===== CALENDAR OPERATIONS =====
  calendar: {
    create: [
      {
        input: "Schedule a meeting tomorrow at 2pm",
        expected: {
          type: "event",
          operation: "create",
          confidence: "high",
          details: {
            title: "meeting",
            date: "tomorrow",
            startTime: "2:00 PM",
            endTime: "3:00 PM"
          }
        }
      },
      {
        input: "Add an event to my calendar from Mom visit today from 11:00 AM CST to 5:00 PM CST",
        expected: {
          type: "event",
          operation: "create",
          confidence: "high",
          details: {
            title: "Mom visit",
            date: "today",
            startTime: "11:00 AM CST",
            endTime: "5:00 PM CST"
          }
        }
      },
      {
        input: "Book a doctor's appointment for next Monday at 10am",
        expected: {
          type: "event",
          operation: "create",
          confidence: "high",
          details: {
            title: "doctor's appointment",
            date: "next Monday",
            startTime: "10:00 AM",
            endTime: "11:00 AM"
          }
        }
      }
    ],
    
    read: [
      {
        input: "Show my events",
        expected: {
          type: "events",
          operation: "read",
          confidence: "high"
        }
      },
      {
        input: "What's on my calendar?",
        expected: {
          type: "calendar",
          operation: "read",
          confidence: "high"
        }
      }
    ],
    
    update: [
      {
        input: "Update calendar for Oil Change Service on July 9th at 10:00 AM CST",
        expected: {
          type: "event",
          operation: "update",
          confidence: "high",
          details: {
            title: "Oil Change Service",
            date: "July 9th",
            startTime: "10:00 AM CST"
          }
        }
      },
      {
        input: "Change my meeting tomorrow to start at 3pm instead of 2pm",
        expected: {
          type: "event",
          operation: "update",
          confidence: "high",
          details: {
            title: "meeting",
            date: "tomorrow",
            startTime: "3:00 PM"
          }
        }
      }
    ],
    
    delete: [
      {
        input: "Cancel my meeting tomorrow",
        expected: {
          type: "event",
          operation: "delete",
          confidence: "high",
          details: {
            title: "meeting",
            date: "tomorrow"
          }
        }
      },
      {
        input: "Delete the doctor's appointment",
        expected: {
          type: "event",
          operation: "delete",
          confidence: "high",
          details: {
            title: "doctor's appointment"
          }
        }
      }
    ]
  },

  // ===== GENERAL CONVERSATION =====
  general: [
    {
      input: "How are you today?",
      expected: {
        type: "general",
        operation: "help",
        confidence: "high"
      }
    },
    {
      input: "What's the weather like?",
      expected: {
        type: "general",
        operation: "help",
        confidence: "high"
      }
    },
    {
      input: "Can you help me with productivity tips?",
      expected: {
        type: "general",
        operation: "help",
        confidence: "high"
      }
    }
  ],

  // ===== EDGE CASES =====
  edgeCases: [
    {
      input: "Add a goal to learn React and also create a task to practice coding",
      expected: {
        type: "goal", // Should prioritize the first request
        operation: "create",
        confidence: "medium",
        details: {
          title: "learn React",
          targetDate: "next month"
        }
      }
    },
    {
      input: "Update my goal to exercise daily and also schedule a meeting tomorrow",
      expected: {
        type: "goal", // Should prioritize the first request
        operation: "update",
        confidence: "medium",
        details: {
          title: "exercise daily"
        }
      }
    },
    {
      input: "I want to delete my goal to learn React and also complete my task to review documents",
      expected: {
        type: "goal", // Should prioritize the first request
        operation: "delete",
        confidence: "medium",
        details: {
          title: "learn React"
        }
      }
    }
  ],

  // ===== AMBIGUOUS CASES =====
  ambiguous: [
    {
      input: "Add exercise",
      expected: {
        type: "goal", // Could be goal or task, but goal is more common for long-term things
        operation: "create",
        confidence: "medium",
        details: {
          title: "exercise",
          targetDate: "next month"
        }
      }
    },
    {
      input: "Schedule something for tomorrow",
      expected: {
        type: "event", // Calendar event is most likely for scheduling
        operation: "create",
        confidence: "medium",
        details: {
          title: "meeting", // Generic title
          date: "tomorrow",
          startTime: "9:00 AM",
          endTime: "10:00 AM"
        }
      }
    }
  ]
};

/**
 * Test the classification accuracy
 */
export function testClassificationAccuracy() {
  const results = {
    total: 0,
    correct: 0,
    incorrect: 0,
    details: []
  };

  // Test all categories
  Object.keys(GEMINI_TEST_CASES).forEach(category => {
    if (category === 'goals' || category === 'tasks' || category === 'calendar') {
      Object.keys(GEMINI_TEST_CASES[category]).forEach(operation => {
        GEMINI_TEST_CASES[category][operation].forEach(testCase => {
          results.total++;
          // In a real test, you would call the actual classification method here
          // For now, we're just documenting the expected behavior
          results.details.push({
            input: testCase.input,
            expected: testCase.expected,
            actual: "Not tested yet"
          });
        });
      });
    } else {
      GEMINI_TEST_CASES[category].forEach(testCase => {
        results.total++;
        results.details.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: "Not tested yet"
        });
      });
    }
  });

  return results;
}

/**
 * Generate test prompts for manual testing
 */
export function generateTestPrompts() {
  const prompts = [];
  
  Object.keys(GEMINI_TEST_CASES).forEach(category => {
    if (category === 'goals' || category === 'tasks' || category === 'calendar') {
      Object.keys(GEMINI_TEST_CASES[category]).forEach(operation => {
        GEMINI_TEST_CASES[category][operation].forEach(testCase => {
          prompts.push({
            category,
            operation,
            input: testCase.input,
            expected: testCase.expected
          });
        });
      });
    } else {
      GEMINI_TEST_CASES[category].forEach(testCase => {
        prompts.push({
          category,
          operation: 'general',
          input: testCase.input,
          expected: testCase.expected
        });
      });
    }
  });

  return prompts;
}

/**
 * Validate a single test case against actual Gemini response
 */
export function validateTestCase(input, expected, actualResponse) {
  const validation = {
    input,
    expected,
    actual: actualResponse,
    passed: false,
    issues: []
  };

  // Check type classification
  if (actualResponse.type !== expected.type) {
    validation.issues.push(`Type mismatch: expected "${expected.type}", got "${actualResponse.type}"`);
  }

  // Check operation classification
  if (actualResponse.operation !== expected.operation) {
    validation.issues.push(`Operation mismatch: expected "${expected.operation}", got "${actualResponse.operation}"`);
  }

  // Check confidence level
  if (expected.confidence && actualResponse.confidence !== expected.confidence) {
    validation.issues.push(`Confidence mismatch: expected "${expected.confidence}", got "${actualResponse.confidence}"`);
  }

  // Check if all expected details are present
  if (expected.details) {
    Object.keys(expected.details).forEach(key => {
      if (!actualResponse.details || !actualResponse.details[key]) {
        validation.issues.push(`Missing detail: "${key}"`);
      }
    });
  }

  validation.passed = validation.issues.length === 0;
  return validation;
}

/**
 * Example usage and testing instructions
 */
export const TESTING_INSTRUCTIONS = `
# Gemini AI Assistant Test Cases

## How to Use These Test Cases

1. **Manual Testing**: Use these test cases to manually verify the AI assistant behavior
2. **Automated Testing**: Integrate with your testing framework to validate responses
3. **Prompt Improvement**: Use failed test cases to improve Gemini prompts

## Test Categories

### Goals
- Create: "Add a goal to learn React"
- Read: "Show my goals"
- Update: "Update my goal to exercise daily"
- Delete: "Delete my goal to learn React"
- Complete: "Complete my goal to learn React"

### Tasks
- Create: "Add a task to review documents"
- Read: "Show my tasks"
- Update: "Update my task to review documents"
- Delete: "Delete my task to review documents"
- Complete: "Complete my task to review documents"

### Calendar
- Create: "Schedule a meeting tomorrow at 2pm"
- Read: "Show my events"
- Update: "Update my meeting tomorrow"
- Delete: "Cancel my meeting tomorrow"

### General Conversation
- Help requests, general questions, etc.

## Running Tests

1. Import the test cases
2. Iterate through each test case
3. Send the input to your Gemini service
4. Compare the response with expected output
5. Log any discrepancies for prompt improvement

## Example Test Run

\`\`\`javascript
import { GEMINI_TEST_CASES, validateTestCase } from './geminiTestCases.js';

// Test a single case
const testCase = GEMINI_TEST_CASES.goals.create[0];
const actualResponse = await geminiService.processMessage(testCase.input, userId);
const validation = validateTestCase(testCase.input, testCase.expected, actualResponse);

console.log('Test passed:', validation.passed);
if (!validation.passed) {
  console.log('Issues:', validation.issues);
}
\`\`\`
`;

export default GEMINI_TEST_CASES; 