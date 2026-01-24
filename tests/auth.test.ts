import axios from 'axios';
import {
  AUTH_URL,
  log,
  createTestUser,
  extractErrorDetails,
  delay,
  RATE_LIMIT_DELAY_MS,
} from './utils/testUtils';

const TEST_FILE = 'auth.test.ts';
const testUser = createTestUser('auth');

let accessToken: string;
let refreshToken: string;

describe('Auth API', () => {
  // Test user registration
  test('POST /register - should register a new user', async () => {
    log('info', '--- Starting Test: POST /register - should register a new user ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${AUTH_URL}/register`,
        user: testUser,
      },
    });
    try {
      const response = await axios.post(`${AUTH_URL}/register`, testUser);

      expect(response.status).toBe(201);
      expect(response.data.data.user.email).toBe(testUser.email);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();

      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      log('info', 'Pass: User registration successful.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Registration test failed.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // Test registration with existing email
  test('POST /register - should not register a user with an existing email', async () => {
    log('info', '--- Starting Test: POST /register - should not register with existing email ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${AUTH_URL}/register`,
        user: testUser,
        initialCondition: 'User with this email already exists',
      },
    });
    try {
      await axios.post(`${AUTH_URL}/register`, testUser);
      log('error', 'Fail: Registration with existing email succeeded unexpectedly.', TEST_FILE);
      throw new Error('Registration with existing email succeeded unexpectedly.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.error.code).toBe('USER_EXISTS');
        log('info', 'Pass: Correctly blocked registration with existing email.', TEST_FILE);
      } else {
        throw error;
      }
    }
  });

  // Test user login
  test('POST /login - should login the user and return tokens', async () => {
    log('info', '--- Starting Test: POST /login - should login the user and return tokens ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${AUTH_URL}/login`,
        credentials: { email: testUser.email, password: testUser.password },
      },
    });
    try {
      const response = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data.data.user.email).toBe(testUser.email);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();

      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      log('info', 'Pass: User login successful.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Login test failed.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // Rate limit delay after test suite
  afterAll(async () => {
    log('info', 'Test suite complete. Waiting 90 seconds for rate limit cooldown...', TEST_FILE);
    await delay(RATE_LIMIT_DELAY_MS);
    log('info', 'Rate limit cooldown complete.', TEST_FILE);
  });
});
