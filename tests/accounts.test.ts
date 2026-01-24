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

// Helper to get a valid auth token before running tests
beforeAll(async () => {
    log('info', '--- PRE-TEST: Authenticating user to get access token ---', 'accounts.test.ts');
  try {
    // Register a new user for this test suite
    await axios.post(`${AUTH_URL}/register`, testUser);

    // Login to get the token
    const response = await axios.post(`${AUTH_URL}/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = response.data.data.accessToken;
    log('info', 'Authentication successful.', 'accounts.test.ts');
  } catch (error: any) {
    log('error', 'Authentication pre-test failed.', 'accounts.test.ts', {
        data: {
            errorMessage: error.response?.data?.error?.message || error.message,
            statusCode: error.response?.status,
        }
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

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting.', 'accounts.test.ts');
    await delay(60000);
  });

  // Test creating a new account
  test('POST /accounts - should create a new account for the family', async () => {
    log('info', '--- Starting Test: POST /accounts - should create a new account for the family ---', 'accounts.test.ts', {
        inputParameters: {
            endpoint: ACCOUNTS_URL,
            account: testAccount,
        }
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
      log('info', 'Pass: Account creation successful.', 'accounts.test.ts');
    } catch (error: any) {
        log('error', 'Fail: Account creation test failed.', 'accounts.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error;
    }
  });
});