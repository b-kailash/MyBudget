import { describe, it, expect } from '@jest/globals';
import { hashPassword, verifyPassword } from '../apps/backend/src/utils/password';

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

describe('password utilities', () => {
  const plainPassword = 'mySecretPassword123!';

  beforeAll(() => {
    log('info', '--- Testing Password Utilities ---', 'password.test.ts');
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting (if applicable).', 'password.test.ts');
    await delay(60000);
  });

  it('should correctly hash a password', async () => {
    log('info', 'Test: should correctly hash a password', 'password.test.ts', { inputParameters: { plainPassword } });
    const hashedPassword = await hashPassword(plainPassword);
    expect(hashedPassword).toBeDefined();
    expect(typeof hashedPassword).toBe('string');
    expect(hashedPassword).not.toBe(plainPassword);
    log('info', 'Pass: Correctly hashed a password.', 'password.test.ts');
  });

  it('should correctly verify a password against its hash', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    log('info', 'Test: should correctly verify a password against its hash', 'password.test.ts', {
      inputParameters: { plainPassword, hashedPassword },
      initialCondition: 'A password has been hashed.',
    });
    const isMatch = await verifyPassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
    log('info', 'Pass: Correctly verified a password against its hash.', 'password.test.ts');
  });

  it('should return false for an incorrect password', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    log('info', 'Test: should return false for an incorrect password', 'password.test.ts', {
      inputParameters: { incorrectPassword: 'wrongPassword', hashedPassword },
      initialCondition: 'A password has been hashed.',
    });
    const isMatch = await verifyPassword('wrongPassword', hashedPassword);
    expect(isMatch).toBe(false);
    log('info', 'Pass: Correctly returned false for an incorrect password.', 'password.test.ts');
  });
});