import * as chrono from 'chrono-node';

/**
 * Hybrid DateParser that combines regex patterns, chrono-node, and smart context
 * for robust natural language date parsing.
 */
export class DateParser {
  constructor() {
    // Common day patterns
    this.dayPatterns = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4, 
      friday: 5, saturday: 6, sunday: 0
    };
    
    // Contextual mappings
    this.contextMappings = {
      'this weekend': 'this saturday',
      'next weekend': 'next saturday',
      'last weekend': 'last saturday',
      'this week': 'this monday',
      'next week': 'next monday',
      'last week': 'last monday'
    };
  }

  /**
   * Main entry point for parsing natural language dates
   * @param {string} expression - Natural language date expression
   * @returns {string} Date in YYYY-MM-DD format, or null if parsing fails
   */
  parse(expression) {
    if (!expression || typeof expression !== 'string') {
      return null;
    }

    const normalizedExpression = expression.toLowerCase().trim();
    
    // Try contextual mappings first
    const contextualResult = this.parseContextualDate(normalizedExpression);
    if (contextualResult) return contextualResult;
    
    // Try relative date patterns
    const relativeResult = this.parseRelativeDate(normalizedExpression);
    if (relativeResult) return relativeResult;
    
    // Fall back to chrono-node for complex expressions
    const chronoResult = this.parseWithChrono(normalizedExpression);
    if (chronoResult) return chronoResult;
    
    return null;
  }

  /**
   * Handle contextual date expressions like "this weekend", "next week"
   */
  parseContextualDate(expression) {
    if (expression === 'next weekend') {
      return this.getSaturdayAfterThisWeek();
    }
    const mapping = this.contextMappings[expression];
    if (mapping) {
      return this.parseRelativeDate(mapping);
    }
    return null;
  }

  /**
   * Get the Saturday after this week (i.e., skip this coming Saturday)
   */
  getSaturdayAfterThisWeek() {
    const today = new Date();
    const currentDay = today.getDay();
    // Find this week's Saturday
    let daysToThisSaturday = 6 - currentDay;
    if (daysToThisSaturday < 0) daysToThisSaturday += 7;
    // Saturday after this week is 7 days after this week's Saturday
    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() + daysToThisSaturday + 7);
    return this.formatDate(resultDate);
  }

  /**
   * Parse relative date expressions using regex patterns
   * Handles: "next Friday", "last week", "this month", etc.
   */
  parseRelativeDate(expression) {
    // Pattern: (next|last|this) + (day|week|month|year|dayname)
    const relativePattern = /^(next|last|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day|week|month|year)$/i;
    const match = expression.match(relativePattern);
    
    if (!match) return null;
    
    const [, modifier, unit] = match;
    const today = new Date();
    
    // Handle day names
    if (this.dayPatterns[unit]) {
      return this.calculateDayOfWeek(today, modifier, this.dayPatterns[unit]);
    }
    
    // Handle time units
    return this.calculateTimeUnit(today, modifier, unit);
  }

  /**
   * Calculate date for specific day of week
   * - "next Monday": always the Monday after today
   * - "last Monday": always the Monday before today
   * - "this Monday": today if today is Monday, otherwise the next Monday
   */
  calculateDayOfWeek(baseDate, modifier, targetDay) {
    const currentDay = baseDate.getDay();
    let resultDate = new Date(baseDate);

    switch (modifier.toLowerCase()) {
      case 'next':
        // Always go to the next occurrence, even if today is the target day
        let daysToNext = targetDay - currentDay;
        if (daysToNext <= 0) daysToNext += 7;
        resultDate.setDate(baseDate.getDate() + daysToNext);
        break;
      case 'last':
        // Always go to the previous occurrence, even if today is the target day
        let daysToLast = targetDay - currentDay;
        if (daysToLast >= 0) daysToLast -= 7;
        resultDate.setDate(baseDate.getDate() + daysToLast);
        break;
      case 'this':
        if (currentDay === targetDay) {
          // Today is the target day, use today
          // resultDate is already set to baseDate
        } else if (currentDay < targetDay) {
          // Later this week
          resultDate.setDate(baseDate.getDate() + (targetDay - currentDay));
        } else {
          // Already passed this week, use next week's target day
          resultDate.setDate(baseDate.getDate() + (7 - (currentDay - targetDay)));
        }
        break;
    }
    return this.formatDate(resultDate);
  }

  /**
   * Calculate date for time units (week, month, year)
   * - For week: always return the Monday of the next/last/this week
   * - For month/year: preserve day-of-month, but if not valid, use last day of month
   */
  calculateTimeUnit(baseDate, modifier, unit) {
    let resultDate = new Date(baseDate);
    switch (unit.toLowerCase()) {
      case 'week': {
        // Find current week's Monday
        const dayOfWeek = baseDate.getDay();
        const daysToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        let monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() + daysToMonday);
        
        switch (modifier) {
          case 'next':
            monday.setDate(monday.getDate() + 7);
            break;
          case 'last':
            monday.setDate(monday.getDate() - 7);
            break;
          case 'this':
            // Already set to this week's Monday
            break;
        }
        resultDate = monday;
        break;
      }
      case 'month': {
        let year = baseDate.getFullYear();
        let month = baseDate.getMonth();
        let day = baseDate.getDate();
        
        if (modifier === 'next') {
          month += 1;
        } else if (modifier === 'last') {
          month -= 1;
        }
        // For 'this', keep current month
        
        // Handle month overflow/underflow
        if (month > 11) {
          month = 0;
          year += 1;
        } else if (month < 0) {
          month = 11;
          year -= 1;
        }
        
        // Set to the same day, or last day of the month if not valid
        let newDate = new Date(year, month, 1);
        let lastDay = new Date(year, month + 1, 0).getDate();
        newDate.setDate(Math.min(day, lastDay));
        resultDate = newDate;
        break;
      }
      case 'year': {
        let year = baseDate.getFullYear();
        let month = baseDate.getMonth();
        let day = baseDate.getDate();
        
        if (modifier === 'next') {
          year += 1;
        } else if (modifier === 'last') {
          year -= 1;
        }
        // For 'this', keep current year
        
        // Set to the same day/month, or last day of the month if not valid
        let newDate = new Date(year, month, 1);
        let lastDay = new Date(year, month + 1, 0).getDate();
        newDate.setDate(Math.min(day, lastDay));
        resultDate = newDate;
        break;
      }
    }
    return this.formatDate(resultDate);
  }

  /**
   * Use chrono-node for complex date expressions
   */
  parseWithChrono(expression) {
    try {
      // Always use new Date() as base for chrono-node to get current date
      const parsed = chrono.parseDate(expression, new Date(), { forwardDate: true });
      if (parsed && !isNaN(parsed)) {
        return this.formatDate(parsed);
      }
    } catch (error) {
      console.warn('Chrono parsing failed for expression:', expression, error);
    }
    return null;
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Validate if a string is already in YYYY-MM-DD format
   */
  isFormattedDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateString);
  }

  /**
   * Parse and normalize date, handling both formatted and natural language
   */
  parseAndNormalize(dateExpression) {
    if (!dateExpression) return null;
    
    // If already formatted, return as-is
    if (this.isFormattedDate(dateExpression)) {
      return dateExpression;
    }
    
    // Try to parse natural language
    return this.parse(dateExpression);
  }
}

// Export singleton instance for easy use
export const dateParser = new DateParser(); 