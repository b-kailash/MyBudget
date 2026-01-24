import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const API_URL = `${process.env.BASE_URL}/api/v1`;
const AUTH_URL = `${API_URL}/auth`;
const CATEGORIES_URL = `${API_URL}/categories`;
const ACCOUNTS_URL = `${API_URL}/accounts`;
const TRANSACTIONS_URL = `${API_URL}/transactions`;

const uniqueId = new Date().getTime();

// User for this test suite
const testUser = {
  email: `transaction_user_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Transaction Test User',
  familyName: 'The Transaction Family',
};

let accessToken: string;
let categoryId: string;
let accountId: string;
let transactionId: string;

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

// --- Test Suite ---

describe('Transactions API', () => {
  // 1. Set up a user, a category, and an account before starting
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Setting up user, category, and account for transactions ---', 'transactions.test.ts');
    try {
      // Register and login user
      await axios.post(`${AUTH_URL}/register`, testUser);
      const loginResponse = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = loginResponse.data.data.accessToken;
      log('info', 'User authenticated.', 'transactions.test.ts');

      // Create a category for the transaction
      const categoryPayload = { name: 'Salary', type: 'INCOME' };
      const categoryResponse = await axios.post(CATEGORIES_URL, categoryPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      categoryId = categoryResponse.data.data.id;
      log('info', 'Category "Salary" created.', 'transactions.test.ts');

      // Create an account for the transaction
      const accountPayload = { name: 'Current Account', type: 'BANK', currency: 'USD', openingBalance: 1000 };
      const accountResponse = await axios.post(ACCOUNTS_URL, accountPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      accountId = accountResponse.data.data.id;
      log('info', 'Account "Current Account" created.', 'transactions.test.ts');

    } catch (error: any) {
        log('error', 'PRE-TEST FAILED: Could not set up required resources.', 'transactions.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error;
    }
  });

    afterEach(async () => {
        log('info', 'Pausing for 1 minute to respect rate limiting.', 'transactions.test.ts');
        await delay(60000);
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
    log('info', '--- Starting Test: POST /transactions ---', 'transactions.test.ts', {
        inputParameters: {
            endpoint: TRANSACTIONS_URL,
            transaction: transactionPayload,
        }
      });
    try {
      const response = await axios.post(TRANSACTIONS_URL, transactionPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.payee).toBe(transactionPayload.payee);
      expect(response.data.data.amount).toBe(transactionPayload.amount);
      transactionId = response.data.data.id;
      log('info', 'Pass: Transaction created successfully.', 'transactions.test.ts');
    } catch (error: any) {
        log('error', 'Fail: Failed to create transaction.', 'transactions.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error;
    }
  });
});