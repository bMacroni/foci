import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DateParser, dateParser } from '../src/utils/dateParser.js';

describe('DateParser Tests', () => {
  let parser;
  let mockToday;

  beforeEach(() => {
    parser = new DateParser();
    
    // Mock today as a known date for consistent testing
    // Let's use 2024-01-15 (Monday) as our test date
    mockToday = new Date('2024-01-15T12:00:00.000Z'); // Use noon UTC to ensure it's Monday
    
    // Mock Date constructor to return our test date
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

  afterEach(() => {
    // Restore original Date constructor
    global.Date = Date;
  });

  describe('Contextual Date Parsing', () => {
    it('should parse "this weekend" as Saturday', () => {
      const result = parser.parse('this weekend');
      expect(result).toBe('2024-01-20'); // Saturday
    });

    it('should parse "next weekend" as next Saturday', () => {
      const result = parser.parse('next weekend');
      expect(result).toBe('2024-01-27'); // Next Saturday
    });

    it('should parse "this week" as Monday', () => {
      const result = parser.parse('this week');
      expect(result).toBe('2024-01-15'); // Monday
    });

    it('should parse "next week" as next Monday', () => {
      const result = parser.parse('next week');
      expect(result).toBe('2024-01-22'); // Next Monday
    });
  });

  describe('Relative Day Parsing', () => {
    it('should parse "next Friday"', () => {
      const result = parser.parse('next Friday');
      expect(result).toBe('2024-01-19'); // Friday
    });

    it('should parse "last Friday"', () => {
      const result = parser.parse('last Friday');
      expect(result).toBe('2024-01-12'); // Previous Friday
    });

    it('should parse "this Friday"', () => {
      const result = parser.parse('this Friday');
      expect(result).toBe('2024-01-19'); // Friday
    });

    it('should parse "next Monday"', () => {
      const result = parser.parse('next Monday');
      expect(result).toBe('2024-01-22'); // Next Monday
    });

    it('should parse "last Monday"', () => {
      const result = parser.parse('last Monday');
      expect(result).toBe('2024-01-08'); // Previous Monday
    });
  });

  describe('Time Unit Parsing', () => {
    it('should parse "next week"', () => {
      const result = parser.parse('next week');
      expect(result).toBe('2024-01-22'); // Next Monday
    });

    it('should parse "last week"', () => {
      const result = parser.parse('last week');
      expect(result).toBe('2024-01-08'); // Previous Monday
    });

    it('should parse "next month"', () => {
      const result = parser.parse('next month');
      expect(result).toBe('2024-02-15'); // Same day next month
    });

    it('should parse "last month"', () => {
      const result = parser.parse('last month');
      expect(result).toBe('2023-12-15'); // Same day previous month
    });

    it('should parse "next year"', () => {
      const result = parser.parse('next year');
      expect(result).toBe('2025-01-15'); // Same day next year
    });

    it('should parse "last year"', () => {
      const result = parser.parse('last year');
      expect(result).toBe('2023-01-15'); // Same day previous year
    });
  });

  describe('Chrono-node Fallback', () => {
    it('should parse "tomorrow"', () => {
      const result = parser.parse('tomorrow');
      expect(result).toBe('2024-01-16');
    });

    it('should parse "in 3 days"', () => {
      const result = parser.parse('in 3 days');
      expect(result).toBe('2024-01-18');
    });

    it('should parse "next month"', () => {
      const result = parser.parse('next month');
      expect(result).toBe('2024-02-15');
    });
  });

  describe('Formatted Date Handling', () => {
    it('should return formatted dates as-is', () => {
      const result = parser.parseAndNormalize('2024-12-25');
      expect(result).toBe('2024-12-25');
    });

    it('should handle null/undefined', () => {
      expect(parser.parse(null)).toBeNull();
      expect(parser.parse(undefined)).toBeNull();
      expect(parser.parse('')).toBeNull();
    });

    it('should validate formatted dates', () => {
      expect(parser.isFormattedDate('2024-12-25')).toBe(true);
      expect(parser.isFormattedDate('2024-12-25T10:00:00Z')).toBe(false);
      expect(parser.isFormattedDate('next Friday')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle case insensitive input', () => {
      expect(parser.parse('NEXT FRIDAY')).toBe('2024-01-19');
      expect(parser.parse('Next Friday')).toBe('2024-01-19');
      expect(parser.parse('next friday')).toBe('2024-01-19');
    });

    it('should handle whitespace', () => {
      expect(parser.parse('  next friday  ')).toBe('2024-01-19');
    });

    it('should return null for invalid expressions', () => {
      expect(parser.parse('invalid date')).toBeNull();
      expect(parser.parse('next invalid')).toBeNull();
    });
  });

  describe('Singleton Instance', () => {
    it('should work with the singleton instance', () => {
      const result = dateParser.parse('next Friday');
      expect(result).toBe('2024-01-19');
    });
  });
}); 