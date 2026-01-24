import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const API_URL = `${process.env.BASE_URL}/api/v1`;
const AUTH_URL = `${API_URL}/auth`;
const CATEGORIES_URL = `${API_URL}/categories`;
const ACCOUNTS_URL = `${API_URL}/accounts`;
const BUDGETS_URL = `${API_URL}/budgets`;

const uniqueId = new Date().getTime();

// User for this test suite
const testUser = {
  email: `budget_user_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Budget Test User',
  familyName: 'The Budget Family',
};

let accessToken: string;
let categoryId: string;
let accountId: string;
let budgetId: string;

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

describe('Budgets API', () => {
  // 1. Set up a user, a category, and an account before starting the tests
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Setting up user, category, and account ---', 'budgets.test.ts');
    try {
      // Register and login user
      await axios.post(`${AUTH_URL}/register`, testUser);
      const loginResponse = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = loginResponse.data.data.accessToken;
      log('info', 'User authenticated.', 'budgets.test.ts');

      // Create a category
      const categoryPayload = { name: 'Transport', type: 'EXPENSE' };
      const categoryResponse = await axios.post(CATEGORIES_URL, categoryPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      categoryId = categoryResponse.data.data.id;
      log('info', 'Category created.', 'budgets.test.ts');

      // Create an account
      const accountPayload = { name: 'Main Bank', type: 'BANK', currency: 'USD', openingBalance: 5000 };
      const accountResponse = await axios.post(ACCOUNTS_URL, accountPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      accountId = accountResponse.data.data.id;
      log('info', 'Account created.', 'budgets.test.ts');

    } catch (error: any) {
      log('error', 'PRE-TEST FAILED: Could not set up required resources.', 'budgets.test.ts', {
        data: {
            errorMessage: error.response?.data?.error?.message || error.message,
            statusCode: error.response?.status,
        }
      });
      throw error;
    }
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting.', 'budgets.test.ts');
    await delay(60000);
  });

  // 2. Create a new budget for the category
  test('POST /budgets - should create a new budget for a category', async () => {
    const budgetPayload = {
        categoryId: categoryId,
        amount: 500,
        periodType: 'MONTHLY',
        startDate: new Date().toISOString(),
      };
    log('info', '--- Starting Test: POST /budgets ---', 'budgets.test.ts', {
        inputParameters: {
            endpoint: BUDGETS_URL,
            budget: budgetPayload,
        }
      });
    try {
      const response = await axios.post(BUDGETS_URL, budgetPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.amount).toBe(budgetPayload.amount);
      expect(response.data.data.categoryId).toBe(categoryId);
      budgetId = response.data.data.id;
      log('info', 'Pass: Budget created successfully.', 'budgets.test.ts');
    } catch (error: any) {
        log('error', 'Fail: Failed to create budget.', 'budgets.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error;
    }
  });
});