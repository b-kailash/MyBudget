import { config, validateConfig } from '../apps/backend/src/config';

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

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

describe('Application Configuration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting (if applicable).', 'config.test.ts');
    await delay(60000);
  });

  it('should load configuration correctly with valid environment variables', () => {
    log('info', 'Test: should load configuration correctly with valid environment variables', 'config.test.ts', {
        inputParameters: {
            NODE_ENV: 'development',
            PORT: '3001',
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
            JWT_SECRET: 'a_very_long_and_secure_jwt_secret_string',
            CORS_ORIGIN: 'http://localhost:3000',
        }
    });
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3001';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    process.env.JWT_SECRET = 'a_very_long_and_secure_jwt_secret_string';
    process.env.CORS_ORIGIN = 'http://localhost:3000';

    const { config, validateConfig } = require('../apps/backend/src/config');

    expect(config.server.env).toBe('development');
    expect(config.server.port).toBe(3001);
    
    expect(() => validateConfig()).not.toThrow();
    log('info', 'Pass: Loaded configuration correctly with valid environment variables.', 'config.test.ts');
  });

  it('should throw an error if a required environment variable is missing', () => {
    log('info', 'Test: should throw an error if a required environment variable is missing', 'config.test.ts', {
        initialCondition: 'DATABASE_URL is missing',
    });
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL; // Simulate missing variable
    
    const requireConfig = () => require('../apps/backend/src/config');
    expect(requireConfig).toThrow('Missing required environment variable: DATABASE_URL');
    log('info', 'Pass: Correctly threw an error for missing DATABASE_URL.', 'config.test.ts');
  });
});