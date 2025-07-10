import { describe, it, expect } from 'vitest';
import * as chrono from 'chrono-node';

// Mock the tasksController to test date parsing
const mockCreateTaskFromAI = async (args, userId, userContext) => {
  // Simulate the date parsing logic we'll implement
  const { due_date, ...otherArgs } = args;
  
  let parsedDueDate = due_date;
  if (due_date && typeof due_date === 'string') {
    // Check if it's already a properly formatted date (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(due_date)) {
      // Already formatted, keep as is
      parsedDueDate = due_date;
    } else {
      // Try to parse natural language dates
      const parsed = chrono.parseDate(due_date, new Date(), { forwardDate: true });
      if (parsed && !isNaN(parsed)) {
        const now = new Date();
        // If year is in the past, or not this year or next, set to this year
        if (parsed.getFullYear() < now.getFullYear() || parsed.getFullYear() > now.getFullYear() + 1) {
          parsed.setFullYear(now.getFullYear());
        }
        // If the date is in the past, move to next year
        if (parsed < now) {
          parsed.setFullYear(parsed.getFullYear() + 1);
        }
        // Format as YYYY-MM-DD
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        parsedDueDate = `${yyyy}-${mm}-${dd}`;
      }
    }
  }
  
  return {
    ...otherArgs,
    due_date: parsedDueDate,
    success: true
  };
};

describe('Date Parsing Tests', () => {
  it('should parse "this weekend" to a valid date', async () => {
    const result = await mockCreateTaskFromAI({
      title: 'clean the garage',
      due_date: 'this weekend'
    }, 'user123', {});
    
    expect(result.success).toBe(true);
    expect(result.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.due_date).not.toBe('this weekend');
  });

  it('should parse "tomorrow" to a valid date', async () => {
    const result = await mockCreateTaskFromAI({
      title: 'buy groceries',
      due_date: 'tomorrow'
    }, 'user123', {});
    
    expect(result.success).toBe(true);
    expect(result.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.due_date).not.toBe('tomorrow');
  });

  it('should handle already formatted dates', async () => {
    const result = await mockCreateTaskFromAI({
      title: 'meeting',
      due_date: '2024-12-25'
    }, 'user123', {});
    
    expect(result.success).toBe(true);
    expect(result.due_date).toBe('2024-12-25');
  });

  it('should handle null/undefined due_date', async () => {
    const result = await mockCreateTaskFromAI({
      title: 'no due date task'
    }, 'user123', {});
    
    expect(result.success).toBe(true);
    expect(result.due_date).toBeUndefined();
  });

  it('should handle empty string due_date', async () => {
    const result = await mockCreateTaskFromAI({
      title: 'empty due date task',
      due_date: ''
    }, 'user123', {});
    
    expect(result.success).toBe(true);
    expect(result.due_date).toBe('');
  });
}); 