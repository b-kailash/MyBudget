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

describe('Auth API', () => {
  // Test user registration
  test('POST /register - should register a new user', async () => {
    log('info', '--- Starting Test: POST /register - should register a new user ---', 'auth.test.ts', {
      inputParameters: {
        endpoint: `${AUTH_URL}/register`,
        user: testUser,
      }
    });
    try {
      const response = await axios.post(`${AUTH_URL}/register`, testUser);

      expect(response.status).toBe(201);
      expect(response.data.data.user.email).toBe(testUser.email);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();

      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      log('info', 'Pass: User registration successful.', 'auth.test.ts');
    } catch (error: any) {
      log('error', 'Fail: Registration test failed.', 'auth.test.ts', {
        data: {
          errorMessage: error.response?.data?.error?.message || error.message,
          statusCode: error.response?.status,
        }
      });
      throw error;
    }
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting.', 'auth.test.ts');
    await delay(60000);
  });

  // Test registration with existing email
  test('POST /register - should not register a user with an existing email', async () => {
    log('info', '--- Starting Test: POST /register - should not register a user with an existing email ---', 'auth.test.ts', {
        inputParameters: {
            endpoint: `${AUTH_URL}/register`,
            user: testUser,
            initialCondition: 'User with this email already exists',
        }
    });
    try {
      await axios.post(`${AUTH_URL}/register`, testUser);
      log('error', 'Fail: Registration with existing email succeeded unexpectedly.', 'auth.test.ts');
      throw new Error('Registration with existing email succeeded unexpectedly.');
    } catch (error: any) {
      expect(error.response.status).toBe(409);
      expect(error.response.data.error.code).toBe('USER_EXISTS');
      log('info', 'Pass: Correctly blocked registration with existing email.', 'auth.test.ts');
    }
  });

  // Test user login
  test('POST /login - should login the user and return tokens', async () => {
    log('info', '--- Starting Test: POST /login - should login the user and return tokens ---', 'auth.test.ts', {
        inputParameters: {
            endpoint: `${AUTH_URL}/login`,
            credentials: { email: testUser.email, password: testUser.password },
        }
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
      log('info', 'Pass: User login successful.', 'auth.test.ts');
    } catch (error: any) {
        log('error', 'Fail: Login test failed.', 'auth.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
        });
      throw error;
    }
  });
});