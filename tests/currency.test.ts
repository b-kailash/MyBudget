import {
    formatCurrency,
    parseCurrency,
    formatCompactCurrency,
  } from '../../packages/shared/src/utils/currency';
  
  const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };
  
  describe('Currency Utilities', () => {
    beforeAll(() => {
      log('info', '--- Testing Currency Utilities ---');
    });
  
    describe('formatCurrency', () => {
      it('should format a number as USD currency', () => {
        log('info', 'Test: formatCurrency with USD');
        const result = formatCurrency(1234.56, 'USD');
        expect(result).toBe('$1,234.56');
        log('info', 'Pass: Formatted USD currency correctly.');
      });
  
      it('should format a number as EUR currency with a different locale', () => {
        log('info', 'Test: formatCurrency with EUR and de-DE locale');
        const result = formatCurrency(1234.56, 'EUR', 'de-DE');
        expect(result).toContain('1.234,56');
        expect(result).toContain('€');
        log('info', 'Pass: Formatted EUR currency with de-DE locale correctly.');
      });
    });
  
    describe('parseCurrency', () => {
      it('should parse a USD currency string to a number', () => {
        log('info', 'Test: parseCurrency with USD string');
        const result = parseCurrency('$1,234.56');
        expect(result).toBe(1234.56);
        log('info', 'Pass: Parsed USD string correctly.');
      });
  
      it('should parse a EUR currency string to a number', () => {
        log('info', 'Test: parseCurrency with EUR string');
        const result = parseCurrency('1.234,56 €');
        expect(result).toBe(1234.56);
        log('info', 'Pass: Parsed EUR string correctly.');
      });
    });
  
    describe('formatCompactCurrency', () => {
      it('should format a number into a compact K format', () => {
        log('info', 'Test: formatCompactCurrency with K format');
        const result = formatCompactCurrency(1234, 'USD');
        expect(result).toBe('$1.2K');
        log('info', 'Pass: Formatted compact K format correctly.');
      });
  
      it('should format a number into a compact M format', () => {
        log('info', 'Test: formatCompactCurrency with M format');
        const result = formatCompactCurrency(1234567, 'USD');
        expect(result).toBe('$1.2M');
        log('info', 'Pass: Formatted compact M format correctly.');
      });
    });
  });
