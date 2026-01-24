import { config, validateConfig } from '../apps/backend/src/config';

// Mock the dotenv config function to prevent it from reading the actual .env file
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

describe('Application Configuration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // This is important to re-run the config file with new env vars
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should load configuration correctly with valid environment variables', () => {
    log('info', 'Test: should load config with valid environment variables');
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3001';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    process.env.JWT_SECRET = 'a_very_long_and_secure_jwt_secret_string';
    process.env.CORS_ORIGIN = 'http://localhost:3000';

    const { config, validateConfig } = require('../apps/backend/src/config');

    expect(config.server.env).toBe('development');
    expect(config.server.port).toBe(3001);
    
    expect(() => validateConfig()).not.toThrow();
    log('info', 'Pass: Loaded configuration correctly.');
  });

  it('should throw an error if a required environment variable is missing', () => {
    log('info', 'Test: should throw an error for missing required environment variables');
    process.env.NODE_ENV = 'production';
    
    const requireConfig = () => require('../apps/backend/src/config');
    expect(requireConfig).toThrow('Missing required environment variable: DATABASE_URL');
    log('info', 'Pass: Threw an error for missing DATABASE_URL.');
  });
});
