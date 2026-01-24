import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const API_URL = `${process.env.BASE_URL}/api/v1`;
const AUTH_URL = `${API_URL}/auth`;
const CATEGORIES_URL = `${API_URL}/categories`;

const uniqueId = new Date().getTime();

// User for this test suite
const testUser = {
  email: `category_user_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Category Test User',
  familyName: 'The Category Family',
};

let accessToken: string;
let parentCategoryId: string;

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

describe('Categories API', () => {
  // 1. Register and authenticate a user before starting the tests
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Registering and authenticating a user ---', 'categories.test.ts');
    try {
      // Register user
      await axios.post(`${AUTH_URL}/register`, testUser);

      // Login to get token
      const response = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = response.data.data.accessToken;
      log('info', 'User for category tests authenticated successfully.', 'categories.test.ts');
    } catch (error: any) {
        log('error', 'PRE-TEST FAILED: Could not set up user.', 'categories.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error;
    }
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting.', 'categories.test.ts');
    await delay(60000);
  });

  // 2. Create a new parent category
  test('POST /categories - should create a new parent category', async () => {
    const parentCategory = {
        name: 'Groceries',
        type: 'EXPENSE',
        color: '#FF5733',
        icon: 'shopping_cart',
      };
    log('info', '--- Starting Test: POST /categories for a parent category ---', 'categories.test.ts', {
        inputParameters: {
            endpoint: CATEGORIES_URL,
            category: parentCategory,
        }
      });
    try {
      const response = await axios.post(CATEGORIES_URL, parentCategory, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.name).toBe(parentCategory.name);
      expect(response.data.data.parentId).toBeNull();
      parentCategoryId = response.data.data.id; // Save for sub-category test
      log('info', 'Pass: Parent category created successfully.', 'categories.test.ts');
    } catch (error: any) {
        log('error', 'Fail: Failed to create parent category.', 'categories.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error;
    }
  });
});