import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Validates and returns an environment variable
 * @throws Error if the variable is not set
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Application configuration
 * Validates all required environment variables on startup
 */
export const config = {
  /**
   * Server configuration
   */
  server: {
    env: getEnvVar('NODE_ENV', 'development'),
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    isDevelopment: getEnvVar('NODE_ENV', 'development') === 'development',
    isProduction: getEnvVar('NODE_ENV', 'development') === 'production',
  },

  /**
   * Database configuration
   */
  database: {
    url: getEnvVar('DATABASE_URL'),
  },

  /**
   * JWT configuration
   */
  jwt: {
    secret: getEnvVar('JWT_SECRET'),
    accessExpiresIn: getEnvVar('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  /**
   * CORS configuration
   */
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
  },
} as const;

/**
 * Validates all required configuration on startup
 * @throws Error if any required configuration is missing or invalid
 */
export function validateConfig(): void {
  // Validate port is a valid number
  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(config.server.env)) {
    throw new Error(`Invalid NODE_ENV: ${config.server.env}. Must be one of: ${validEnvs.join(', ')}`);
  }

  // Validate DATABASE_URL format
  if (!config.database.url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate JWT secret length (should be reasonably secure)
  if (config.jwt.secret.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters for security');
  }

  console.log('Configuration validated successfully');
}
