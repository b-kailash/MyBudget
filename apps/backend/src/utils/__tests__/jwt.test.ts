import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  JwtPayload,
} from '../jwt';
import { config } from '../../config'; // Import the mocked config

// Mock the config module explicitly here for clarity, though it's set up in jest.setup.ts
// This block is mainly for demonstrating that the config is indeed mocked.
jest.mock('../../config', () => ({
  config: {
    jwt: {
      secret: 'test-jwt-secret-for-jwt-test', // Use a distinct secret for this test file
      accessExpiresIn: '1h',
      refreshSecret: 'test-refresh-secret-for-jwt-test',
      refreshExpiresIn: '7d',
    },
    // Other config properties can be mocked if needed
  },
}));

describe('JWT utilities', () => {
  const userId = 'user-123';
  const familyId = 'family-456';
  const role = 'member';

  describe('generateAccessToken and verifyAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(userId, familyId, role);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify a valid access token and return its payload', () => {
      const token = generateAccessToken(userId, familyId, role);
      const payload = verifyAccessToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(userId);
      expect(payload?.familyId).toBe(familyId);
      expect(payload?.role).toBe(role);
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });

    it('should return null for an invalid access token', () => {
      const invalidToken = 'invalid.jwt.token';
      const payload = verifyAccessToken(invalidToken);
      expect(payload).toBeNull();
    });

    it('should return null for an expired access token', () => {
      // Temporarily set a very short expiry for testing expiration
      const originalAccessExpiresIn = config.jwt.accessExpiresIn;
      config.jwt.accessExpiresIn = '1ms'; // 1 millisecond

      const token = generateAccessToken(userId, familyId, role);

      // Wait for the token to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const payload = verifyAccessToken(token);
          expect(payload).toBeNull();
          config.jwt.accessExpiresIn = originalAccessExpiresIn; // Restore original config
          resolve(null);
        }, 50); // A bit longer than 1ms
      });
    });
  });

  describe('generateRefreshToken and hashRefreshToken', () => {
    it('should generate a random refresh token', () => {
      const refreshToken = generateRefreshToken();
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken).toHaveLength(64); // 32 bytes * 2 hex chars per byte
    });

    it('should generate different refresh tokens each time', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      expect(token1).not.toBe(token2);
    });

    it('should hash a refresh token', () => {
      const refreshToken = generateRefreshToken();
      const hashedToken = hashRefreshToken(refreshToken);
      expect(hashedToken).toBeDefined();
      expect(typeof hashedToken).toBe('string');
      expect(hashedToken).toHaveLength(64); // SHA256 hash is 64 hex characters
      expect(hashedToken).not.toBe(refreshToken); // Hash should be different from original
    });

    it('should produce the same hash for the same refresh token', () => {
      const refreshToken = generateRefreshToken();
      const hashedToken1 = hashRefreshToken(refreshToken);
      const hashedToken2 = hashRefreshToken(refreshToken);
      expect(hashedToken1).toBe(hashedToken2);
    });
  });
});
