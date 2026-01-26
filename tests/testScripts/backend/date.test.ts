import {
    formatDate,
    parseDate,
    getStartOfPeriod,
    getEndOfPeriod,
    toISODate,
  } from '../../packages/shared/src/utils/date';
  import { BudgetPeriod } from '../../packages/shared/src/types';
  
  const log = (level: 'info' | 'error' | 'warning', message: string, testScriptFile: string, data?: any) => {
    const logObject: any = {
        level,
        timestamp: new Date().toISOString(),
        "Test Script File": testScriptFile,
        message,
    };

    if (data?.inputParameters) {
        logObject["Input Parameters"] = data.inputParameters;
    }
    if (data?.data) {
        logObject["data"] = data.data;
    }

    console.log(JSON.stringify(logObject, null, 2));
};

describe('Date Utilities', () => {
    beforeAll(() => {
      log('info', '--- Testing Date Utilities ---', 'date.test.ts');
    });
  
    describe('formatDate', () => {
      it('should format a Date object into a yyyy-MM-dd string', () => {
        log('info', 'Test: formatDate with a Date object', 'date.test.ts', {
            inputParameters: { date: '2024-01-15T10:00:00Z', format: 'yyyy-MM-dd' },
        });
        const date = new Date('2024-01-15T10:00:00Z');
        const result = formatDate(date);
        expect(result).toBe('2024-01-15');
        log('info', 'Pass: Formatted a Date object correctly.', 'date.test.ts');
      });
  
      it('should format an ISO string with a custom format', () => {
        log('info', 'Test: formatDate with a custom format string', 'date.test.ts', {
            inputParameters: { date: '2024-01-15T10:00:00Z', format: 'MMM dd, yyyy' },
        });
        const result = formatDate('2024-01-15T10:00:00Z', 'MMM dd, yyyy');
        expect(result).toBe('Jan 15, 2024');
        log('info', 'Pass: Formatted an ISO string with a custom format correctly.', 'date.test.ts');
      });
    });
  
    describe('parseDate', () => {
      it('should parse an ISO date string to a Date object', () => {
        log('info', 'Test: parseDate with an ISO string', 'date.test.ts', {
            inputParameters: { dateString: '2024-01-15T10:00:00Z' },
        });
        const result = parseDate('2024-01-15T10:00:00Z');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
        log('info', 'Pass: Parsed an ISO string to a Date object correctly.', 'date.test.ts');
      });
  
      it('should throw an error for an invalid date string', () => {
        log('info', 'Test: parseDate with an invalid string', 'date.test.ts', {
            inputParameters: { dateString: 'not-a-date' },
        });
        expect(() => parseDate('not-a-date')).toThrow('Invalid date string: not-a-date');
        log('info', 'Pass: Correctly threw an error for an invalid date string.', 'date.test.ts');
      });
    });
  
    describe('getStartOfPeriod and getEndOfPeriod', () => {
      const testDate = new Date('2024-03-15T12:00:00Z'); // A Friday
  
      it('should return the correct start and end of the week', () => {
        log('info', 'Test: getStartOfPeriod and getEndOfPeriod for WEEKLY', 'date.test.ts', {
            inputParameters: { date: testDate.toISOString(), period: BudgetPeriod.WEEKLY },
        });
        const start = getStartOfPeriod(testDate, BudgetPeriod.WEEKLY);
        const end = getEndOfPeriod(testDate, BudgetPeriod.WEEKLY);
        expect(toISODate(start)).toBe('2024-03-10');
        expect(toISODate(end)).toBe('2024-03-16');
        log('info', 'Pass: Correctly calculated start and end of the week.', 'date.test.ts');
      });
    });
  });