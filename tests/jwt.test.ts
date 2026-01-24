import { describe, it, expect } from '@jest/globals';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../apps/backend/src/utils/jwt';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

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

describe('JWT utilities', () => {
  const userId = 'user-123';
  const familyId = 'family-456';
  const role = 'MEMBER';

  beforeAll(() => {
    log('info', '--- Testing JWT Utilities ---', 'jwt.test.ts');
    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      log('error', 'JWT secrets are not defined in the environment. Skipping tests.', 'jwt.test.ts');
      throw new Error('JWT secrets are not defined. Please create a .env file with JWT_SECRET and REFRESH_TOKEN_SECRET.');
    }
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting (if applicable).', 'jwt.test.ts');
    await delay(60000);
  });

  describe('generateAccessToken and verifyAccessToken', () => {
    it('should generate a valid access token', () => {
      log('info', 'Test: should generate a valid access token', 'jwt.test.ts', {
        inputParameters: { userId, familyId, role },
      });
      const token = generateAccessToken(userId, familyId, role);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      log('info', 'Pass: Generated a valid access token.', 'jwt.test.ts');
    });

    it('should verify a valid access token and return its payload', () => {
        log('info', 'Test: should verify a valid access token', 'jwt.test.ts', {
            inputParameters: { userId, familyId, role },
            initialCondition: 'A valid access token is generated',
        });
      const token = generateAccessToken(userId, familyId, role);
      const payload = verifyAccessToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(userId);
      expect(payload?.familyId).toBe(familyId);
      expect(payload?.role).toBe(role);
      log('info', 'Pass: Verified a valid access token.', 'jwt.test.ts');
    });
  });

  describe('generateRefreshToken and hashRefreshToken', () => {
    it('should generate a random refresh token', () => {
        log('info', 'Test: should generate a random refresh token', 'jwt.test.ts');
      const refreshToken = generateRefreshToken();
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken).toHaveLength(64);
      log('info', 'Pass: Generated a random refresh token.', 'jwt.test.ts');
    });

    it('should hash a refresh token', () => {
        log('info', 'Test: should hash a refresh token', 'jwt.test.ts', {
            initialCondition: 'A random refresh token is generated',
        });
      const refreshToken = generateRefreshToken();
      const hashedToken = hashRefreshToken(refreshToken);
      expect(hashedToken).toBeDefined();
      expect(typeof hashedToken).toBe('string');
      expect(hashedToken).not.toBe(refreshToken);
      log('info', 'Pass: Hashed a refresh token.', 'jwt.test.ts');
    });
  });
});