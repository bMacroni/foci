import { describe, it, expect, beforeEach } from 'vitest';
import { DateParser } from '../src/utils/dateParser.js';

describe('Debug DateParser', () => {
  let parser;
  let mockToday;

  beforeEach(() => {
    parser = new DateParser();
    
    // Mock today as 2024-01-15 (Monday)
    mockToday = new Date('2024-01-15T12:00:00.000Z'); // Use noon UTC to ensure it's Monday
    
    // Mock Date constructor
    const originalDate = global.Date;
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(mockToday);
        } else {
          super(...args);
        }
      }
    };
  });

  it('should debug next Monday calculation', () => {
    const today = new Date(); // Should be 2024-01-15
    console.log('Today:', today.toISOString());
    console.log('Today day of week:', today.getDay()); // Should be 1 (Monday)
    
    const result = parser.parse('next Monday');
    console.log('Result:', result);
    
    // Manual calculation
    const currentDay = today.getDay(); // 1 (Monday)
    const targetDay = 1; // Monday
    let daysToNext = targetDay - currentDay; // 1 - 1 = 0
    if (daysToNext <= 0) daysToNext += 7; // 0 + 7 = 7
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() + daysToNext);
    console.log('Expected:', expectedDate.toISOString());
    
    expect(result).toBe('2024-01-22');
  });
}); 