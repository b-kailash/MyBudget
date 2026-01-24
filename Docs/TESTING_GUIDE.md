# MyBudget Backend Testing Guide

This document provides comprehensive instructions for running the automated test suite against a deployed instance of the MyBudget backend API.

## 1. Introduction

The test suite is designed to validate the functionality, security, and performance of the MyBudget backend. It uses `jest` as the test runner and `axios` to make HTTP requests to the API endpoints.

**Before you begin:** Ensure you have a running instance of the MyBudget backend API accessible from the machine where you will be running the tests.

## 2. Prerequisites

To run the tests, you need the following software installed on your system:

*   **Node.js & npm**: Version 18.0.0 or higher is required.
*   **Git**: For cloning the repository.

## 3. Test Environment Setup

1.  **Clone the Repository**:
    If you haven't already, clone the MyBudget repository to your local machine:
    ```bash
    git clone https://github.com/b-kailash/MyBudget.git
    cd MyBudget
    ```

2.  **Install Dependencies**:
    Install the necessary `npm` packages for the tests. The test scripts are located in the `tests` directory at the root of the project.
    ```bash
    cd tests
    npm install
    ```

3.  **Configure the Test Environment**:
    The tests require a `.env` file to be present in the `tests` directory. This file specifies the base URL of the API to be tested.

    Create a `.env` file in the `tests` directory:
    ```bash
    touch .env
    ```

    Open the newly created `.env` file and add the following line, replacing the URL with the actual URL of your running backend instance:
    ```
    BASE_URL=http://your-backend-api-url.com
    ```
    For example:
    ```
    BASE_URL=http://192.168.1.235:3000
    ```
    You may also need to add `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `DATABASE_URL` if running unit tests that depend on these (e.g., config tests, JWT utility tests).

    **IMPORTANT**: The test suite is destructive and will create and delete data in the database. It is highly recommended to run these tests against a dedicated testing or staging environment, **NOT** a production environment.

## 4. Project Structure

The test suite is organized as follows:

```
tests/
├── utils/
│   └── testUtils.ts      # Centralized utilities (logging, auth, delay functions)
├── jest.config.js        # Jest configuration
├── testSequencer.js      # Custom test sequencer for ordered execution
├── package.json          # Test dependencies
├── run_all_tests.sh      # Main test runner script
├── .env                  # Environment configuration (create this)
├── logs/                 # Generated test logs
└── *.test.ts             # Individual test files
```

### Key Files

- **`utils/testUtils.ts`**: Contains shared utilities including:
  - Standardized JSON logging function
  - Authentication helpers (`createTestUser`, `authenticateUser`)
  - Rate limit delay constants and functions
  - Error extraction utilities

- **`testSequencer.js`**: Custom Jest sequencer that runs tests in a specific order:
  1. `health.test.ts` - Basic connectivity check
  2. `auth.test.ts` - Authentication tests
  3. `accounts.test.ts` - Account management
  4. `categories.test.ts` - Category management
  5. `transactions.test.ts` - Transaction operations
  6. `budgets.test.ts` - Budget management
  7. `family.test.ts` - Family management

## 5. Running the Tests

### Option 1: Using the Shell Script (Recommended)

The `run_all_tests.sh` script in the `tests` directory is the recommended way to run the entire test suite. This script will:
1.  Ensure all dependencies are installed.
2.  Run all test files ending in `.test.ts`.
3.  Generate a detailed log file named `test_run_YYYY-MM-DD_HH-MM-SS.log` in the `tests/logs` directory.

**To execute the tests:**

1.  Navigate to the `tests` directory:
    ```bash
    cd tests
    ```

2.  Make the script executable:
    ```bash
    chmod +x run_all_tests.sh
    ```

3.  Run the script:
    ```bash
    ./run_all_tests.sh
    ```

After the script finishes, a new log file will be created in the `tests/logs` directory.

### Option 2: Using npm/npx Directly

You can also run the tests using npm:

```bash
cd tests
npm test
```

Or using npx with additional options:

```bash
cd tests
npx jest --verbose --detectOpenHandles --forceExit
```

### Option 3: Running Specific Tests

To run only a specific test file:

```bash
cd tests
npx jest auth.test.ts --verbose
```

To run tests matching a pattern:

```bash
cd tests
npx jest --testNamePattern="should create" --verbose
```

## 6. Interpreting the Test Logs

The log file contains a detailed, timestamped record of the entire test execution, formatted as JSON objects. Each log entry includes:
*   `level`: `info`, `warning`, or `error`.
*   `timestamp`: The time the log entry was created.
*   `Test Script File`: The name of the test file that generated the log.
*   `message`: A descriptive message about the test step or outcome.
*   `Input Parameters`: (Optional) All input parameters passed to the API with their names for easy debugging.
*   `data`: (Optional) Additional data, such as `errorMessage` and `statusCode` for errors, or `responseBody` for successful requests.

**Example Pass Log Entry:**
```json
{
  "level": "info",
  "timestamp": "2026-01-24T12:00:01.500Z",
  "Test Script File": "auth.test.ts",
  "message": "Pass: User registration successful."
}
```

**Example Fail Log Entry:**
```json
{
  "level": "error",
  "timestamp": "2026-01-24T12:00:10.100Z",
  "Test Script File": "auth.test.ts",
  "message": "Fail: Get user profile test failed.",
  "data": {
    "errorMessage": "Request failed with status code 401",
    "statusCode": 401
  }
}
```

**Example Pre-test Setup Log:**
```json
{
  "level": "info",
  "timestamp": "2026-01-24T12:00:00.000Z",
  "Test Script File": "accounts.test.ts",
  "message": "--- PRE-TEST: Authenticating user to get access token ---"
}
```

## 7. Rate Limiting Considerations

The backend API implements rate limiting on authentication endpoints. To prevent tests from being blocked, the test suite includes a **90-second delay** after each test suite completes. This is implemented in the `afterAll` hook of each test file.

The delay is configurable in `utils/testUtils.ts`:

```typescript
// Rate limiting delay (90 seconds = 90,000 ms)
export const RATE_LIMIT_DELAY_MS = 90 * 1000;
```

**Important Notes:**
- Tests run sequentially (one at a time) to respect rate limits
- The Jest configuration includes extended timeouts to accommodate these delays
- Each test suite creates a unique user to avoid conflicts between test runs
- The logs will indicate when rate limit cooldown periods start and end

## 8. Jest Configuration

The test suite uses the following Jest configuration (`jest.config.js`):

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  maxWorkers: 1,                    // Run tests sequentially
  testTimeout: 300000,              // 5 minute timeout per test
  testSequencer: './testSequencer.js', // Custom execution order
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
```

## 9. Existing Test Files

The following test files are included in the test suite:

| Test File | Description |
|-----------|-------------|
| `auth.test.ts` | Tests user registration, login, and token refresh |
| `accounts.test.ts` | Tests CRUD operations for accounts |
| `categories.test.ts` | Tests CRUD operations for categories and sub-categories |
| `budgets.test.ts` | Tests CRUD operations for budgets |
| `transactions.test.ts` | Tests CRUD operations for transactions |
| `family.test.ts` | Tests family management (invites, members) |
| `health.test.ts` | Checks basic health of the backend server |
| `jwt.test.ts` | Unit tests for JWT utility functions |
| `password.test.ts` | Unit tests for password hashing utilities |
| `prisma.test.ts` | Tests Prisma client singleton behavior |
| `middleware.test.ts` | Unit tests for Express middleware |
| `currency.test.ts` | Unit tests for currency utilities |
| `date.test.ts` | Unit tests for date utilities |
| `config.test.ts` | Unit tests for configuration loading |
| `conflict.test.ts` | Tests for 409 conflict scenarios |
| `failing.test.ts` | Sample failing test for demonstration |

## 10. Writing New Tests

To add a new test script:

1. Create a new file in the `tests` directory with a `.test.ts` extension (e.g., `newfeature.test.ts`).

2. Import the shared utilities:
   ```typescript
   import {
     API_URL,
     AUTH_URL,
     log,
     createTestUser,
     extractErrorDetails,
     delay,
     RATE_LIMIT_DELAY_MS,
   } from './utils/testUtils';
   ```

3. Define test file constant:
   ```typescript
   const TEST_FILE = 'newfeature.test.ts';
   ```

4. Create a test user for authentication:
   ```typescript
   const testUser = createTestUser('newfeature');
   ```

5. Add the rate limit delay in `afterAll`:
   ```typescript
   afterAll(async () => {
     log('info', 'Test suite complete. Waiting 90 seconds for rate limit cooldown...', TEST_FILE);
     await delay(RATE_LIMIT_DELAY_MS);
     log('info', 'Rate limit cooldown complete.', TEST_FILE);
   });
   ```

6. (Optional) Add your test to the custom sequencer in `testSequencer.js` to control execution order.

### Example Test Template

```typescript
import axios from 'axios';
import {
  API_URL,
  AUTH_URL,
  log,
  createTestUser,
  extractErrorDetails,
  delay,
  RATE_LIMIT_DELAY_MS,
} from './utils/testUtils';

const TEST_FILE = 'newfeature.test.ts';
const FEATURE_URL = `${API_URL}/feature`;

const testUser = createTestUser('feature');
let accessToken: string;

describe('Feature API', () => {
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Setting up test user ---', TEST_FILE);
    try {
      await axios.post(`${AUTH_URL}/register`, testUser);
      const response = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = response.data.data.accessToken;
      log('info', 'User authenticated.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'PRE-TEST FAILED.', TEST_FILE, {
        data: { errorMessage: details.message, statusCode: details.statusCode },
      });
      throw error;
    }
  });

  test('POST /feature - should create a feature', async () => {
    log('info', '--- Starting Test: POST /feature ---', TEST_FILE, {
      inputParameters: { endpoint: FEATURE_URL },
    });
    try {
      const response = await axios.post(FEATURE_URL, { name: 'Test' }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(201);
      log('info', 'Pass: Feature created.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Feature creation failed.', TEST_FILE, {
        data: { errorMessage: details.message, statusCode: details.statusCode },
      });
      throw error;
    }
  });

  afterAll(async () => {
    log('info', 'Test suite complete. Waiting 90 seconds for rate limit cooldown...', TEST_FILE);
    await delay(RATE_LIMIT_DELAY_MS);
    log('info', 'Rate limit cooldown complete.', TEST_FILE);
  });
});
```

## 11. Troubleshooting

### Tests Failing with 429 Status Code
This indicates rate limiting. Increase the `RATE_LIMIT_DELAY_MS` in `utils/testUtils.ts`.

### Tests Timing Out
The default timeout is 5 minutes. If tests need longer, adjust `testTimeout` in `jest.config.js`.

### Cannot Connect to API
Verify:
1. The backend server is running
2. The `BASE_URL` in `.env` is correct
3. There are no firewall issues blocking the connection

### TypeScript Compilation Errors
Ensure you have the correct TypeScript version installed:
```bash
npm install
```
