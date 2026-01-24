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

## 4. Running the Tests

The `run_all_tests.sh` script in the `tests` directory is the recommended way to run the entire test suite. This script will:
1.  Ensure all dependencies are installed.
2.  Run all test files ending in `.test.ts`.
3.  Generate a detailed log file named `test_run_YYYY-MM-DD_HH-MM-SS.log` in the `tests/logs` directory.

### To execute the tests:

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

## 5. Interpreting the Test Logs

The log file contains a detailed, timestamped record of the entire test execution, formatted as JSON objects. Each log entry includes:
*   `level`: `INFO`, `WARNING`, or `ERROR`.
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

## 6. Rate Limiting Considerations

The backend API implements rate limiting on certain endpoints. To prevent tests from being prematurely blocked, a **1-minute pause** is included `afterEach` test in the test suite. This ensures that subsequent tests do not immediately hit rate limits from previous tests. The logs will indicate when these pauses occur.

## 7. Existing Test Files

The following test files are included in the test suite:

*   `auth.test.ts`: Tests user registration, login, logout, and token refresh.
*   `accounts.test.ts`: Tests the CRUD operations for accounts.
*   `categories.test.ts`: Tests the CRUD operations for categories and sub-categories.
*   `budgets.test.ts`: Tests the CRUD operations for budgets.
*   `transactions.test.ts`: Tests the CRUD operations for transactions.
*   `family.test.ts`: Tests family management features like inviting and managing members.
*   `failing.test.ts`: A sample test file designed to fail, to demonstrate the failure reporting.
*   `conflict.test.ts`: A sample test file that tests for a 409 conflict scenario.
*   `health.test.ts`: Checks the basic health of the backend server.
*   `jwt.test.ts`: Unit tests for the JWT utility functions (e.g., token generation and verification).
*   `password.test.ts`: Unit tests for the password hashing utility functions.
*   `prisma.test.ts`: Tests the Prisma client singleton behavior.
*   `middleware.test.ts`: Unit tests for various Express middleware (authentication, CORS, error handling, not found, rate limit, request logger, validation).
*   `currency.test.ts`: Unit tests for currency formatting and parsing utilities.
*   `date.test.ts`: Unit tests for date formatting and manipulation utilities.

## 8. Writing New Tests

To add a new test script, create a new file in the `tests` directory with a `.test.ts` extension (e.g., `newfeature.test.ts`). The test runner will automatically discover and execute it.

Follow the existing structure in the test files as a template for new tests. Ensure you include detailed logging and consider adding appropriate pauses for any new endpoints that might be subject to rate limiting.
