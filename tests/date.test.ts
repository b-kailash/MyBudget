import {
    formatDate,
    parseDate,
    getStartOfPeriod,
    getEndOfPeriod,
    toISODate,
  } from '../../packages/shared/src/utils/date';
  import { BudgetPeriod } from '../../packages/shared/src/types';
  
  const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };
  
  describe('Date Utilities', () => {
    beforeAll(() => {
      log('info', '--- Testing Date Utilities ---');
    });
  
    describe('formatDate', () => {
      it('should format a Date object into a yyyy-MM-dd string', () => {
        log('info', 'Test: formatDate with a Date object');
        const date = new Date('2024-01-15T10:00:00Z');
        const result = formatDate(date);
        expect(result).toBe('2024-01-15');
        log('info', 'Pass: Formatted a Date object correctly.');
      });
  
      it('should format an ISO string with a custom format', () => {
        log('info', 'Test: formatDate with a custom format string');
        const result = formatDate('2024-01-15T10:00:00Z', 'MMM dd, yyyy');
        expect(result).toBe('Jan 15, 2024');
        log('info', 'Pass: Formatted an ISO string with a custom format correctly.');
      });
    });
  
    describe('parseDate', () => {
      it('should parse an ISO date string to a Date object', () => {
        log('info', 'Test: parseDate with an ISO string');
        const result = parseDate('2024-01-15T10:00:00Z');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
        log('info', 'Pass: Parsed an ISO string to a Date object correctly.');
      });
  
      it('should throw an error for an invalid date string', () => {
        log('info', 'Test: parseDate with an invalid string');
        expect(() => parseDate('not-a-date')).toThrow('Invalid date string: not-a-date');
        log('info', 'Pass: Correctly threw an error for an invalid date string.');
      });
    });
  
    describe('getStartOfPeriod and getEndOfPeriod', () => {
      const testDate = new Date('2024-03-15T12:00:00Z'); // A Friday
  
      it('should return the correct start and end of the week', () => {
        log('info', 'Test: getStartOfPeriod and getEndOfPeriod for WEEKLY');
        const start = getStartOfPeriod(testDate, BudgetPeriod.WEEKLY);
        const end = getEndOfPeriod(testDate, BudgetPeriod.WEEKLY);
        // Assuming week starts on Sunday (0)
        expect(toISODate(start)).toBe('2024-03-10');
        expect(toISODate(end)).toBe('2024-03-16');
        log('info', 'Pass: Correctly calculated start and end of the week.');
      });
    });
  });
