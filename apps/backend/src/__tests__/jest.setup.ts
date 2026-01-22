// apps/backend/src/__tests__/jest.setup.ts

// Mock the config module for JWT tests, as it relies on process.env
// This ensures tests are isolated from the actual environment variables
// and can use consistent, test-specific values.
jest.mock('../config', () => ({
  config: {
    jwt: {
      secret: 'test-jwt-secret',
      accessExpiresIn: '15m',
      refreshSecret: 'test-refresh-secret',
      refreshExpiresIn: '7d',
    },
    server: {
      port: 3000,
      env: 'test',
    },
    database: {
      url: 'postgresql://test:test@localhost:5432/testdb',
    },
    cors: {
      origin: '*',
    },
  },
}));
