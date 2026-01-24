import { describe, it, expect } from '@jest/globals';
import { hashPassword, verifyPassword } from '../../utils/password.js';

describe('password utilities', () => {
  const plainPassword = 'mySecretPassword123!';

  it('should correctly hash a password', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    expect(hashedPassword).toBeDefined();
    expect(typeof hashedPassword).toBe('string');
    // Bcrypt hashes typically start with $2a$, $2b$, or $2y$
    expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$[./0-9A-Za-z]{53}$/);
  });

  it('should correctly verify a password against its hash', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await verifyPassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it('should return false for an incorrect password', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await verifyPassword('wrongPassword', hashedPassword);
    expect(isMatch).toBe(false);
  });

  it('should return false for an invalid hash', async () => {
    const isMatch = await verifyPassword(plainPassword, 'invalidhash');
    expect(isMatch).toBe(false);
  });
});
