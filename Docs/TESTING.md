# MyBudget Testing Guide

Guide for running automated tests against the MyBudget API.

## Overview

The test suite validates:
- Authentication and authorization
- CRUD operations for all resources
- Rate limiting and security features
- API response formats

**Tech Stack:** Jest + Axios + TypeScript

## Prerequisites

- Node.js >= 18.0.0
- A running MyBudget backend instance
- Access to the backend URL

## Quick Start

```bash
# 1. Navigate to tests directory
cd tests

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your backend URL

# 4. Run all tests
./run_all_tests.sh
```

## Configuration

### Environment File

Create `tests/.env`:

```bash
# Backend API URL (required)
BASE_URL=http://localhost:3000

# Optional: For unit tests that need these
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
DATABASE_URL=postgresql://user:password@localhost:5432/mybudgetdb
```

**Example configurations:**

| Environment | BASE_URL |
|-------------|----------|
| Local | `http://localhost:3000` |
| Remote | `http://192.168.1.235:3000` |

**Warning:** Tests are destructive. Run against a test environment, not production.

## Running Tests

### Option 1: Run All Tests (Recommended)

```bash
cd tests
./run_all_tests.sh
```

This:
- Runs all test files in order
- Creates timestamped log file in `tests/logs/`
- Handles rate limit delays between tests

### Option 2: Run with npm

```bash
cd tests
npm test
```

### Option 3: Run Specific Test

```bash
cd tests
npx jest auth.test.ts --verbose
```

### Option 4: Run Tests Matching Pattern

```bash
cd tests
npx jest --testNamePattern="should create" --verbose
```

## Test Files

| File | Tests |
|------|-------|
| `health.test.ts` | API health check |
| `auth.test.ts` | Registration, login, token refresh, logout |
| `accounts.test.ts` | Account CRUD operations |
| `categories.test.ts` | Category CRUD, subcategories |
| `transactions.test.ts` | Transaction CRUD, filters |
| `budgets.test.ts` | Budget CRUD operations |
| `family.test.ts` | Family invitations, member management |

### Unit Tests

| File | Tests |
|------|-------|
| `jwt.test.ts` | JWT utility functions |
| `password.test.ts` | Password hashing |
| `currency.test.ts` | Currency formatting |
| `date.test.ts` | Date utilities |
| `config.test.ts` | Configuration loading |

## Test Execution Order

Tests run sequentially in this order:
1. `health.test.ts` - Verifies API is reachable
2. `auth.test.ts` - Creates test user
3. `accounts.test.ts` - Uses authenticated user
4. `categories.test.ts`
5. `transactions.test.ts`
6. `budgets.test.ts`
7. `family.test.ts`

## Understanding Test Output

### Console Output

```
PASS  auth.test.ts
  Auth API
    ✓ POST /auth/register - should register new user (523 ms)
    ✓ POST /auth/login - should login user (234 ms)
    ✓ GET /auth/me - should return user profile (112 ms)
```

### Log Files

Logs are saved to `tests/logs/test_run_YYYY-MM-DD_HH-MM-SS.log`

**Success entry:**
```json
{
  "level": "info",
  "timestamp": "2026-01-26T12:00:01.500Z",
  "Test Script File": "auth.test.ts",
  "message": "Pass: User registration successful."
}
```

**Failure entry:**
```json
{
  "level": "error",
  "timestamp": "2026-01-26T12:00:10.100Z",
  "Test Script File": "auth.test.ts",
  "message": "Fail: Login test failed.",
  "data": {
    "errorMessage": "Request failed with status code 401",
    "statusCode": 401
  }
}
```

## Rate Limiting

The API has rate limits:
- Auth endpoints: 5 requests/minute per IP
- API endpoints: 100 requests/minute per user

The test suite includes **90-second delays** between test files to avoid rate limiting.

Configure in `tests/utils/testUtils.ts`:
```typescript
export const RATE_LIMIT_DELAY_MS = 90 * 1000;
```

## Writing New Tests

### 1. Create Test File

Create `tests/newfeature.test.ts`:

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
const testUser = createTestUser('newfeature');
let accessToken: string;

describe('New Feature API', () => {
  beforeAll(async () => {
    log('info', 'Setting up test user', TEST_FILE);

    // Register and login
    await axios.post(`${AUTH_URL}/register`, testUser);
    const response = await axios.post(`${AUTH_URL}/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = response.data.data.accessToken;
  });

  test('should do something', async () => {
    log('info', 'Testing something', TEST_FILE);

    try {
      const response = await axios.get(`${API_URL}/something`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);
      log('info', 'Pass: Test passed', TEST_FILE);
    } catch (error) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Test failed', TEST_FILE, {
        data: { errorMessage: details.message, statusCode: details.statusCode },
      });
      throw error;
    }
  });

  afterAll(async () => {
    log('info', 'Waiting for rate limit cooldown...', TEST_FILE);
    await delay(RATE_LIMIT_DELAY_MS);
  });
});
```

### 2. Add to Test Sequencer (Optional)

Edit `tests/testSequencer.js` to control execution order:

```javascript
const testOrder = [
  'health.test.ts',
  'auth.test.ts',
  // ... existing tests ...
  'newfeature.test.ts',  // Add your test
];
```

## Troubleshooting

### 429 Too Many Requests

**Cause:** Rate limited

**Fix:** Increase delay in `utils/testUtils.ts` or wait before rerunning tests.

### Connection Refused

**Cause:** Backend not running

**Fix:**
1. Start the backend: `npm run dev --workspace=apps/backend`
2. Verify `BASE_URL` in `tests/.env` is correct

### Tests Timing Out

**Cause:** Default timeout (5 min) exceeded

**Fix:** Increase `testTimeout` in `tests/jest.config.js`:
```javascript
testTimeout: 600000, // 10 minutes
```

### TypeScript Errors

**Cause:** Missing dependencies or type definitions

**Fix:**
```bash
cd tests
npm install
```

## Jest Configuration

Located at `tests/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  maxWorkers: 1,              // Sequential execution
  testTimeout: 300000,        // 5 minute timeout
  testSequencer: './testSequencer.js',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
```

## Next Steps

- [Setup Guide](SETUP.md) - Setting up the application
- [Development Guide](DEVELOPMENT.md) - Running the application
