import axios from 'axios';
import {
  API_URL,
  AUTH_URL,
  log,
  createTestUser,
  extractErrorDetails,
  delay,
  RATE_LIMIT_DELAY_MS,
} from '../../utils/testUtils';

const TEST_FILE = 'accounts.test.ts';
const ACCOUNTS_URL = `${API_URL}/accounts`;

const testUser = createTestUser('account_test');
let accessToken: string;

// Helper to get a valid auth token before running tests
beforeAll(async () => {
  log('info', '--- PRE-TEST: Authenticating user to get access token ---', TEST_FILE);
  try {
    // Register a new user for this test suite
    await axios.post(`${AUTH_URL}/register`, testUser);

    // Login to get the token
    const response = await axios.post(`${AUTH_URL}/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = response.data.data.accessToken;
    log('info', 'Authentication successful.', TEST_FILE);
  } catch (error: unknown) {
    const details = extractErrorDetails(error);
    log('error', 'Authentication pre-test failed.', TEST_FILE, {
      data: {
        errorMessage: details.message,
        statusCode: details.statusCode,
      },
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
    log('info', '--- Starting Test: POST /accounts - should create a new account ---', TEST_FILE, {
      inputParameters: {
        endpoint: ACCOUNTS_URL,
        account: testAccount,
      },
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
      log('info', 'Pass: Account creation successful.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Account creation test failed.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // Test listing accounts
  test('GET /accounts - should list all family accounts', async () => {
    log('info', '--- Starting Test: GET /accounts - should list all accounts ---', TEST_FILE, {
      inputParameters: {
        endpoint: ACCOUNTS_URL,
      },
    });
    try {
      const response = await axios.get(ACCOUNTS_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      log('info', 'Pass: Account listing successful.', TEST_FILE, {
        data: { count: response.data.data.length },
      });
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Account listing test failed.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // Test getting a single account
  test('GET /accounts/:id - should get a specific account', async () => {
    log('info', '--- Starting Test: GET /accounts/:id - should get specific account ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${ACCOUNTS_URL}/${newAccountId}`,
      },
    });
    try {
      const response = await axios.get(`${ACCOUNTS_URL}/${newAccountId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(newAccountId);
      expect(response.data.data.name).toBe(testAccount.name);
      log('info', 'Pass: Get single account successful.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Get single account test failed.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // Test updating an account
  test('PUT /accounts/:id - should update an account', async () => {
    const updateData = { name: 'Updated Checking Account' };
    log('info', '--- Starting Test: PUT /accounts/:id - should update account ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${ACCOUNTS_URL}/${newAccountId}`,
        updateData,
      },
    });
    try {
      const response = await axios.put(`${ACCOUNTS_URL}/${newAccountId}`, updateData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe(updateData.name);
      log('info', 'Pass: Account update successful.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Account update test failed.', TEST_FILE, {
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
