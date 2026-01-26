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

const TEST_FILE = 'budgets.test.ts';
const CATEGORIES_URL = `${API_URL}/categories`;
const ACCOUNTS_URL = `${API_URL}/accounts`;
const BUDGETS_URL = `${API_URL}/budgets`;

// User for this test suite
const testUser = createTestUser('budget');

let accessToken: string;
let categoryId: string;
let accountId: string;
let budgetId: string;

// --- Test Suite ---

describe('Budgets API', () => {
  // 1. Set up a user, a category, and an account before starting the tests
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Setting up user, category, and account ---', TEST_FILE);
    try {
      // Register and login user
      await axios.post(`${AUTH_URL}/register`, testUser);
      const loginResponse = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = loginResponse.data.data.accessToken;
      log('info', 'User authenticated.', TEST_FILE);

      // Create a category
      const categoryPayload = { name: 'Transport', type: 'EXPENSE' };
      const categoryResponse = await axios.post(CATEGORIES_URL, categoryPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      categoryId = categoryResponse.data.data.id;
      log('info', 'Category created.', TEST_FILE);

      // Create an account
      const accountPayload = { name: 'Main Bank', type: 'BANK', currency: 'USD', openingBalance: 5000 };
      const accountResponse = await axios.post(ACCOUNTS_URL, accountPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      accountId = accountResponse.data.data.id;
      log('info', 'Account created.', TEST_FILE);

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

  // 2. Create a new budget for the category
  test('POST /budgets - should create a new budget for a category', async () => {
    const budgetPayload = {
      categoryId: categoryId,
      amount: 500,
      periodType: 'MONTHLY',
      startDate: new Date().toISOString(),
    };
    log('info', '--- Starting Test: POST /budgets ---', TEST_FILE, {
      inputParameters: {
        endpoint: BUDGETS_URL,
        budget: budgetPayload,
      },
    });
    try {
      const response = await axios.post(BUDGETS_URL, budgetPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.amount).toBe(budgetPayload.amount);
      expect(response.data.data.categoryId).toBe(categoryId);
      budgetId = response.data.data.id;
      log('info', 'Pass: Budget created successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to create budget.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 3. List all budgets
  test('GET /budgets - should list all budgets', async () => {
    log('info', '--- Starting Test: GET /budgets ---', TEST_FILE, {
      inputParameters: {
        endpoint: BUDGETS_URL,
      },
    });
    try {
      const response = await axios.get(BUDGETS_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      log('info', 'Pass: Budgets listed successfully.', TEST_FILE, {
        data: { count: response.data.data.length },
      });
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to list budgets.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 4. Get single budget
  test('GET /budgets/:id - should get a specific budget', async () => {
    log('info', '--- Starting Test: GET /budgets/:id ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${BUDGETS_URL}/${budgetId}`,
      },
    });
    try {
      const response = await axios.get(`${BUDGETS_URL}/${budgetId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(budgetId);
      log('info', 'Pass: Budget retrieved successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to get budget.', TEST_FILE, {
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
