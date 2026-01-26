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

const TEST_FILE = 'transactions.test.ts';
const CATEGORIES_URL = `${API_URL}/categories`;
const ACCOUNTS_URL = `${API_URL}/accounts`;
const TRANSACTIONS_URL = `${API_URL}/transactions`;

// User for this test suite
const testUser = createTestUser('transaction');

let accessToken: string;
let categoryId: string;
let accountId: string;
let transactionId: string;

// --- Test Suite ---

describe('Transactions API', () => {
  // 1. Set up a user, a category, and an account before starting
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Setting up user, category, and account for transactions ---', TEST_FILE);
    try {
      // Register and login user
      await axios.post(`${AUTH_URL}/register`, testUser);
      const loginResponse = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = loginResponse.data.data.accessToken;
      log('info', 'User authenticated.', TEST_FILE);

      // Create a category for the transaction
      const categoryPayload = { name: 'Salary', type: 'INCOME' };
      const categoryResponse = await axios.post(CATEGORIES_URL, categoryPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      categoryId = categoryResponse.data.data.id;
      log('info', 'Category "Salary" created.', TEST_FILE);

      // Create an account for the transaction
      const accountPayload = { name: 'Current Account', type: 'BANK', currency: 'USD', openingBalance: 1000 };
      const accountResponse = await axios.post(ACCOUNTS_URL, accountPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      accountId = accountResponse.data.data.id;
      log('info', 'Account "Current Account" created.', TEST_FILE);

    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'PRE-TEST FAILED: Could not set up required resources.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 2. Create a new transaction
  test('POST /transactions - should create a new transaction', async () => {
    const transactionPayload = {
      accountId: accountId,
      categoryId: categoryId,
      type: 'INCOME',
      amount: 5000,
      currency: 'USD',
      date: new Date().toISOString(),
      payee: 'My Employer',
      notes: 'Monthly salary',
    };
    log('info', '--- Starting Test: POST /transactions ---', TEST_FILE, {
      inputParameters: {
        endpoint: TRANSACTIONS_URL,
        transaction: transactionPayload,
      },
    });
    try {
      const response = await axios.post(TRANSACTIONS_URL, transactionPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.payee).toBe(transactionPayload.payee);
      expect(response.data.data.amount).toBe(transactionPayload.amount);
      transactionId = response.data.data.id;
      log('info', 'Pass: Transaction created successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to create transaction.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 3. List transactions
  test('GET /transactions - should list transactions', async () => {
    log('info', '--- Starting Test: GET /transactions ---', TEST_FILE, {
      inputParameters: {
        endpoint: TRANSACTIONS_URL,
      },
    });
    try {
      const response = await axios.get(TRANSACTIONS_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      log('info', 'Pass: Transactions listed successfully.', TEST_FILE, {
        data: { count: response.data.data.length },
      });
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to list transactions.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 4. Get single transaction
  test('GET /transactions/:id - should get a specific transaction', async () => {
    log('info', '--- Starting Test: GET /transactions/:id ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${TRANSACTIONS_URL}/${transactionId}`,
      },
    });
    try {
      const response = await axios.get(`${TRANSACTIONS_URL}/${transactionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(transactionId);
      log('info', 'Pass: Transaction retrieved successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to get transaction.', TEST_FILE, {
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
