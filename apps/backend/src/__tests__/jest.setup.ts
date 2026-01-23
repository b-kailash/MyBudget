// apps/backend/src/__tests__/jest.setup.ts
// Global test setup file

// Set test environment variables before config module is loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.PORT = '3000';
process.env.CORS_ORIGIN = '*';
