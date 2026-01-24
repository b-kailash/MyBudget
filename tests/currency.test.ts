import {
    formatCurrency,
    parseCurrency,
    formatCompactCurrency,
  } from '../../packages/shared/src/utils/currency';
  
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

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  
  describe('Currency Utilities', () => {
    beforeAll(() => {
      log('info', '--- Testing Currency Utilities ---', 'currency.test.ts');
    });

    afterEach(async () => {
        log('info', 'Pausing for 1 minute to respect rate limiting (if applicable).', 'currency.test.ts');
        await delay(60000);
      });
  
    describe('formatCurrency', () => {
      it('should format a number as USD currency', () => {
        log('info', 'Test: formatCurrency with USD', 'currency.test.ts', {
            inputParameters: { amount: 1234.56, currency: 'USD' },
        });
        const result = formatCurrency(1234.56, 'USD');
        expect(result).toBe('$1,234.56');
        log('info', 'Pass: Formatted USD currency correctly.', 'currency.test.ts');
      });
  
      it('should format a number as EUR currency with a different locale', () => {
        log('info', 'Test: formatCurrency with EUR and de-DE locale', 'currency.test.ts', {
            inputParameters: { amount: 1234.56, currency: 'EUR', locale: 'de-DE' },
        });
        const result = formatCurrency(1234.56, 'EUR', 'de-DE');
        expect(result).toContain('1.234,56');
        expect(result).toContain('€');
        log('info', 'Pass: Formatted EUR currency with de-DE locale correctly.', 'currency.test.ts');
      });
    });
  
    describe('parseCurrency', () => {
      it('should parse a USD currency string to a number', () => {
        log('info', 'Test: parseCurrency with USD string', 'currency.test.ts', {
            inputParameters: { value: '$1,234.56' },
        });
        const result = parseCurrency('$1,234.56');
        expect(result).toBe(1234.56);
        log('info', 'Pass: Parsed USD string correctly.', 'currency.test.ts');
      });
  
      it('should parse a EUR currency string to a number', () => {
        log('info', 'Test: parseCurrency with EUR string', 'currency.test.ts', {
            inputParameters: { value: '1.234,56 €' },
        });
        const result = parseCurrency('1.234,56 €');
        expect(result).toBe(1234.56);
        log('info', 'Pass: Parsed EUR string correctly.', 'currency.test.ts');
      });
    });
  
    describe('formatCompactCurrency', () => {
      it('should format a number into a compact K format', () => {
        log('info', 'Test: formatCompactCurrency with K format', 'currency.test.ts', {
            inputParameters: { amount: 1234, currency: 'USD' },
        });
        const result = formatCompactCurrency(1234, 'USD');
        expect(result).toBe('$1.2K');
        log('info', 'Pass: Formatted compact K format correctly.', 'currency.test.ts');
      });
  
      it('should format a number into a compact M format', () => {
        log('info', 'Test: formatCompactCurrency with M format', 'currency.test.ts', {
            inputParameters: { amount: 1234567, currency: 'USD' },
        });
        const result = formatCompactCurrency(1234567, 'USD');
        expect(result).toBe('$1.2M');
        log('info', 'Pass: Formatted compact M format correctly.', 'currency.test.ts');
      });
    });
  });