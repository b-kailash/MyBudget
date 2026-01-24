import axios, { AxiosError } from 'axios';

// Environment validation
if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

// Constants
export const BASE_URL = process.env.BASE_URL;
export const API_URL = `${BASE_URL}/api/v1`;
export const AUTH_URL = `${API_URL}/auth`;

// Rate limiting delay (90 seconds = 90,000 ms)
export const RATE_LIMIT_DELAY_MS = 90 * 1000;

// Shorter delay for within-test pauses (1 second)
export const SHORT_DELAY_MS = 1000;

/**
 * Standardized JSON logger for test scripts
 * Outputs structured JSON logs with consistent format
 */
export interface LogData {
  inputParameters?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export type LogLevel = 'info' | 'error' | 'warning';

export const log = (
  level: LogLevel,
  message: string,
  testScriptFile: string,
  data?: LogData
): void => {
  const logObject: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
    'Test Script File': testScriptFile,
    message,
  };

  if (data?.inputParameters) {
    logObject['Input Parameters'] = data.inputParameters;
  }
  if (data?.data) {
    logObject['data'] = data.data;
  }

  console.log(JSON.stringify(logObject, null, 2));
};

/**
 * Delay execution for specified milliseconds
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wait for rate limit cooldown (90 seconds)
 * Use this between test suites to avoid rate limiting
 */
export const waitForRateLimit = async (testScriptFile: string): Promise<void> => {
  log('info', `Waiting 90 seconds for rate limit cooldown...`, testScriptFile);
  await delay(RATE_LIMIT_DELAY_MS);
  log('info', `Rate limit cooldown complete. Resuming tests.`, testScriptFile);
};

/**
 * Extract error details from axios errors
 */
export const extractErrorDetails = (error: unknown): { message: string; statusCode?: number } => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;
    return {
      message: axiosError.response?.data?.error?.message || axiosError.message,
      statusCode: axiosError.response?.status,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
};

/**
 * Generate unique test identifier based on timestamp
 */
export const generateUniqueId = (): number => new Date().getTime();

/**
 * Authentication helper
 * Registers a new user and returns access token
 */
export interface TestUser {
  email: string;
  password: string;
  name: string;
  familyName: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const createTestUser = (prefix: string): TestUser => {
  const uniqueId = generateUniqueId();
  return {
    email: `${prefix}_${uniqueId}@example.com`,
    password: 'Password123!',
    name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Test User`,
    familyName: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Test Family`,
  };
};

export const authenticateUser = async (
  testUser: TestUser,
  testScriptFile: string
): Promise<AuthResult> => {
  log('info', 'Authenticating test user...', testScriptFile, {
    inputParameters: { email: testUser.email },
  });

  try {
    // Try to register (may fail if user exists)
    await axios.post(`${AUTH_URL}/register`, testUser);
    log('info', 'New user registered.', testScriptFile);
  } catch (error) {
    // User may already exist, try to login
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      log('info', 'User already exists, proceeding to login.', testScriptFile);
    } else {
      const details = extractErrorDetails(error);
      log('warning', 'Registration failed, attempting login.', testScriptFile, {
        data: details,
      });
    }
  }

  // Login to get tokens
  const loginResponse = await axios.post(`${AUTH_URL}/login`, {
    email: testUser.email,
    password: testUser.password,
  });

  log('info', 'Authentication successful.', testScriptFile);
  return loginResponse.data.data;
};

/**
 * Create authenticated axios instance
 */
export const createAuthenticatedClient = (accessToken: string) => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Jest setup helper for rate-limited test suites
 * Call this in afterAll to ensure proper delay between suites
 */
export const setupRateLimitedSuite = (testScriptFile: string): void => {
  afterAll(async () => {
    log('info', 'Test suite complete. Initiating rate limit delay.', testScriptFile);
    await waitForRateLimit(testScriptFile);
  });
};
