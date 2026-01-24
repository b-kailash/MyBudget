import { describe, it, expect } from '@jest/globals';
import { hashPassword, verifyPassword } from '../apps/backend/src/utils/password';

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

describe('password utilities', () => {
  const plainPassword = 'mySecretPassword123!';

  beforeAll(() => {
    log('info', '--- Testing Password Utilities ---');
  });

  it('should correctly hash a password', async () => {
    log('info', 'Test: should correctly hash a password', { input: plainPassword });
    const hashedPassword = await hashPassword(plainPassword);
    expect(hashedPassword).toBeDefined();
    expect(typeof hashedPassword).toBe('string');
    expect(hashedPassword).not.toBe(plainPassword);
    log('info', 'Pass: Correctly hashed a password.');
  });

  it('should correctly verify a password against its hash', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    log('info', 'Test: should correctly verify a password against its hash', {
      input: plainPassword,
      hash: hashedPassword,
    });
    const isMatch = await verifyPassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
    log('info', 'Pass: Correctly verified a password against its hash.');
  });

  it('should return false for an incorrect password', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    log('info', 'Test: should return false for an incorrect password', {
      input: 'wrongPassword',
      hash: hashedPassword,
    });
    const isMatch = await verifyPassword('wrongPassword', hashedPassword);
    expect(isMatch).toBe(false);
    log('info', 'Pass: Correctly returned false for an incorrect password.');
  });
});
