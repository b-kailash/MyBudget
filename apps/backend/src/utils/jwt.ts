import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * JWT payload structure for access tokens
 */
export interface JwtPayload {
  /** User ID */
  userId: string;
  /** Family ID */
  familyId: string;
  /** User role */
  role: string;
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
}

/**
 * Generates a JWT access token for a user
 * @param userId - User's unique identifier
 * @param familyId - Family's unique identifier
 * @param role - User's role within the family
 * @returns Signed JWT access token
 */
export function generateAccessToken(
  userId: string,
  familyId: string,
  role: string
): string {
  const payload: JwtPayload = {
    userId,
    familyId,
    role,
  };

  // Use type assertions to work with readonly config values
  return jwt.sign(
    payload,
    config.jwt.secret as Secret,
    {
      expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions
  );
}

/**
 * Generates a random refresh token (not JWT-based)
 * @returns Random 64-character hex string
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifies and decodes a JWT access token
 * @param token - JWT token to verify
 * @returns Decoded JWT payload or null if invalid
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.secret as Secret
    ) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hashes a refresh token using SHA-256 for secure storage
 * @param token - Plain text refresh token
 * @returns SHA-256 hash of the token
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
