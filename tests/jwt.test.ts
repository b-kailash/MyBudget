import { describe, it, expect } from '@jest/globals';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../apps/backend/src/utils/jwt';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

describe('JWT utilities', () => {
  const userId = 'user-123';
  const familyId = 'family-456';
  const role = 'MEMBER';

  beforeAll(() => {
    log('info', '--- Testing JWT Utilities ---');
    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      log('error', 'JWT secrets are not defined in the environment. Skipping tests.');
      throw new Error('JWT secrets are not defined. Please create a .env file with JWT_SECRET and REFRESH_TOKEN_SECRET.');
    }
  });

  describe('generateAccessToken and verifyAccessToken', () => {
    it('should generate a valid access token', () => {
      log('info', 'Test: should generate a valid access token');
      const token = generateAccessToken(userId, familyId, role);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      log('info', 'Pass: Generated a valid access token.');
    });

    it('should verify a valid access token and return its payload', () => {
        log('info', 'Test: should verify a valid access token');
      const token = generateAccessToken(userId, familyId, role);
      const payload = verifyAccessToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(userId);
      expect(payload?.familyId).toBe(familyId);
      expect(payload?.role).toBe(role);
      log('info', 'Pass: Verified a valid access token.');
    });
  });

  describe('generateRefreshToken and hashRefreshToken', () => {
    it('should generate a random refresh token', () => {
        log('info', 'Test: should generate a random refresh token');
      const refreshToken = generateRefreshToken();
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken).toHaveLength(64);
      log('info', 'Pass: Generated a random refresh token.');
    });

    it('should hash a refresh token', () => {
        log('info', 'Test: should hash a refresh token');
      const refreshToken = generateRefreshToken();
      const hashedToken = hashRefreshToken(refreshToken);
      expect(hashedToken).toBeDefined();
      expect(typeof hashedToken).toBe('string');
      expect(hashedToken).not.toBe(refreshToken);
      log('info', 'Pass: Hashed a refresh token.');
    });
  });
});
