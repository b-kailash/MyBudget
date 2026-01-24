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

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

describe('Conflict API Tests', () => {
  // First, register the user successfully.
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Registering a new user to set up the conflict scenario ---', {
      input: testUser,
    });
    try {
      const response = await axios.post(`${AUTH_URL}/register`, testUser);
      expect(response.status).toBe(201);
      log('info', 'User registered successfully for conflict test.');
    } catch (error: any) {
        log('error', 'Pre-test user registration failed unexpectedly.', {
            errorMessage: error.response?.data?.error?.message || error.message,
            statusCode: error.response?.status,
          });
      throw error; // Fail the entire suite if setup fails
    }
  });

  // This test attempts to register the exact same user again, expecting a conflict.
  test('POST /register - should fail with a 409 Conflict when creating a user that already exists', async () => {
    log('info', '--- Starting Test: POST /register for a user that already exists ---', {
      endpoint: `${AUTH_URL}/register`,
      input: testUser,
      initialCondition: 'User with this email already exists',
    });
    try {
      await axios.post(`${AUTH_URL}/register`, testUser);
      log('error', 'Fail: User registration for an existing user succeeded unexpectedly.');
      throw new Error('User registration for an existing user succeeded unexpectedly.');
    } catch (error: any) {
      if (error.response) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.error.code).toBe('USER_EXISTS');
        log('info', 'Pass: Successfully received a 409 Conflict as expected.');
      } else {
        log('error', 'Fail: Request to register duplicate user failed without a response.', {
            errorMessage: error.message,
          });
        throw error;
      }
    }
  });
});
