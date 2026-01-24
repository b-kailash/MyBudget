import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const AUTH_URL = `${process.env.BASE_URL}/api/v1/auth`;

const uniqueId = new Date().getTime();
const testUser = {
  email: `conflict_user_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Conflict Test User',
  familyName: 'Conflict Family',
};

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

describe('Conflict API Tests', () => {
  // First, register the user successfully.
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Registering a new user to set up the conflict scenario ---', 'conflict.test.ts', {
      inputParameters: {
        user: testUser,
      }
    });
    try {
      const response = await axios.post(`${AUTH_URL}/register`, testUser);
      expect(response.status).toBe(201);
      log('info', 'User registered successfully for conflict test.', 'conflict.test.ts');
    } catch (error: any) {
        log('error', 'Pre-test user registration failed unexpectedly.', 'conflict.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error; // Fail the entire suite if setup fails
    }
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting.', 'conflict.test.ts');
    await delay(60000);
  });

  // This test attempts to register the exact same user again, expecting a conflict.
  test('POST /register - should fail with a 409 Conflict when creating a user that already exists', async () => {
    log('info', '--- Starting Test: POST /register for a user that already exists ---', 'conflict.test.ts', {
        inputParameters: {
            endpoint: `${AUTH_URL}/register`,
            user: testUser,
            initialCondition: 'User with this email already exists',
        }
    });
    try {
      await axios.post(`${AUTH_URL}/register`, testUser);
      log('error', 'Fail: User registration for an existing user succeeded unexpectedly.', 'conflict.test.ts');
      throw new Error('User registration for an existing user succeeded unexpectedly.');
    } catch (error: any) {
      if (error.response) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.error.code).toBe('USER_EXISTS');
        log('info', 'Pass: Successfully received a 409 Conflict as expected.', 'conflict.test.ts');
      } else {
        log('error', 'Fail: Request to register duplicate user failed without a response.', 'conflict.test.ts', {
            data: {
                errorMessage: error.message,
            }
          });
        throw error;
      }
    }
  });
});