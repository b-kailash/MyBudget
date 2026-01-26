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

const TEST_FILE = 'categories.test.ts';
const CATEGORIES_URL = `${API_URL}/categories`;

// User for this test suite
const testUser = createTestUser('category');

let accessToken: string;
let parentCategoryId: string;

// --- Test Suite ---

describe('Categories API', () => {
  // 1. Register and authenticate a user before starting the tests
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Registering and authenticating a user ---', TEST_FILE);
    try {
      // Register user
      await axios.post(`${AUTH_URL}/register`, testUser);

      // Login to get token
      const response = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = response.data.data.accessToken;
      log('info', 'User for category tests authenticated successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'PRE-TEST FAILED: Could not set up user.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 2. Create a new parent category
  test('POST /categories - should create a new parent category', async () => {
    const parentCategory = {
      name: 'Groceries',
      type: 'EXPENSE',
      color: '#FF5733',
      icon: 'shopping_cart',
    };
    log('info', '--- Starting Test: POST /categories for a parent category ---', TEST_FILE, {
      inputParameters: {
        endpoint: CATEGORIES_URL,
        category: parentCategory,
      },
    });
    try {
      const response = await axios.post(CATEGORIES_URL, parentCategory, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.name).toBe(parentCategory.name);
      expect(response.data.data.parentId).toBeNull();
      parentCategoryId = response.data.data.id; // Save for sub-category test
      log('info', 'Pass: Parent category created successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to create parent category.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 3. Create a subcategory under the parent
  test('POST /categories - should create a subcategory', async () => {
    const subcategory = {
      name: 'Fruits',
      type: 'EXPENSE',
      parentId: parentCategoryId,
    };
    log('info', '--- Starting Test: POST /categories for a subcategory ---', TEST_FILE, {
      inputParameters: {
        endpoint: CATEGORIES_URL,
        category: subcategory,
      },
    });
    try {
      const response = await axios.post(CATEGORIES_URL, subcategory, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.name).toBe(subcategory.name);
      expect(response.data.data.parentId).toBe(parentCategoryId);
      log('info', 'Pass: Subcategory created successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to create subcategory.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 4. List all categories
  test('GET /categories - should list all categories', async () => {
    log('info', '--- Starting Test: GET /categories ---', TEST_FILE, {
      inputParameters: {
        endpoint: CATEGORIES_URL,
      },
    });
    try {
      const response = await axios.get(CATEGORIES_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThanOrEqual(2);
      log('info', 'Pass: Categories listed successfully.', TEST_FILE, {
        data: { count: response.data.data.length },
      });
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to list categories.', TEST_FILE, {
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
