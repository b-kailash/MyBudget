import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const AUTH_URL = `${process.env.BASE_URL}/api/v1/auth`;

const uniqueId = new Date().getTime();
const testUser = {
  email: `testuser_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Test User',
  familyName: 'Test Family',
};

let accessToken: string;
let refreshToken: string;

const log = (level: 'info' | 'error', message: string, data?: any) => {
  const logObject = {
    level,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
  console.log(JSON.stringify(logObject, null, 2));
};

describe('Auth API', () => {
  // Test user registration
  test('POST /register - should register a new user', async () => {
    log('info', '--- Starting Test: POST /register - should register a new user ---', {
      endpoint: `${AUTH_URL}/register`,
      input: testUser,
    });
    try {
      const response = await axios.post(`${AUTH_URL}/register`, testUser);

      expect(response.status).toBe(201);
      expect(response.data.data.user.email).toBe(testUser.email);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();

      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      log('info', 'Pass: User registration successful.');
    } catch (error: any) {
      log('error', 'Fail: Registration test failed.', {
        errorMessage: error.response?.data?.error?.message || error.message,
        statusCode: error.response?.status,
      });
      throw error;
    }
  });

  // Test registration with existing email
  test('POST /register - should not register a user with an existing email', async () => {
    log('info', '--- Starting Test: POST /register - should not register a user with an existing email ---', {
      endpoint: `${AUTH_URL}/register`,
      input: testUser,
      initialCondition: 'User with this email already exists',
    });
    try {
      await axios.post(`${AUTH_URL}/register`, testUser);
      log('error', 'Fail: Registration with existing email succeeded unexpectedly.');
      throw new Error('Registration with existing email succeeded unexpectedly.');
    } catch (error: any) {
      expect(error.response.status).toBe(409);
      expect(error.response.data.error.code).toBe('USER_EXISTS');
      log('info', 'Pass: Correctly blocked registration with existing email.');
    }
  });

  // Test user login
  test('POST /login - should login the user and return tokens', async () => {
    log('info', '--- Starting Test: POST /login - should login the user and return tokens ---', {
      endpoint: `${AUTH_URL}/login`,
      input: { email: testUser.email, password: testUser.password },
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
      log('info', 'Pass: User login successful.');
    } catch (error: any) {
      log('error', 'Fail: Login test failed.', {
        errorMessage: error.response?.data?.error?.message || error.message,
        statusCode: error.response?.status,
      });
      throw error;
    }
  });
});
