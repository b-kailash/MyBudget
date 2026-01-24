import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const API_URL = `${process.env.BASE_URL}/api/v1`;
const AUTH_URL = `${API_URL}/auth`;
const ACCOUNTS_URL = `${API_URL}/accounts`;

const uniqueId = new Date().getTime();
const testUser = {
  email: `account_test_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Account Test User',
  familyName: 'Account Test Family',
};

let accessToken: string;

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

// Helper to get a valid auth token before running tests
beforeAll(async () => {
    log('info', '--- PRE-TEST: Authenticating user to get access token ---');
  try {
    // Register a new user for this test suite
    await axios.post(`${AUTH_URL}/register`, testUser);

    // Login to get the token
    const response = await axios.post(`${AUTH_URL}/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = response.data.data.accessToken;
    log('info', 'Authentication successful.');
  } catch (error: any) {
    log('error', 'Authentication pre-test failed.', {
        errorMessage: error.response?.data?.error?.message || error.message,
        statusCode: error.response?.status,
      });
    // If auth fails, we cannot run the tests
    throw new Error('Could not authenticate to run accounts tests.');
  }
});

describe('Accounts API', () => {
  let newAccountId: string;

  const testAccount = {
    name: 'Test Checking Account',
    type: 'BANK',
    currency: 'USD',
    openingBalance: 1000,
  };

  // Test creating a new account
  test('POST /accounts - should create a new account for the family', async () => {
    log('info', '--- Starting Test: POST /accounts - should create a new account for the family ---', {
        endpoint: ACCOUNTS_URL,
        input: testAccount,
      });
    try {
      const response = await axios.post(ACCOUNTS_URL, testAccount, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.name).toBe(testAccount.name);
      expect(response.data.data.id).toBeDefined();
      newAccountId = response.data.data.id;
      log('info', 'Pass: Account creation successful.');
    } catch (error: any) {
        log('error', 'Fail: Account creation test failed.', {
            errorMessage: error.response?.data?.error?.message || error.message,
            statusCode: error.response?.status,
          });
      throw error;
    }
  });
});
