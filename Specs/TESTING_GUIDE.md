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

    Open the `.env` file and add the following line, replacing the URL with the actual URL of your running backend instance:
    ```
    BASE_URL=http://your-backend-api-url.com
    ```
    For example:
    ```
    BASE_URL=http://192.168.1.235:3000
    ```

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

The log file contains a detailed, timestamped record of the entire test execution.

*   Each test suite (e.g., `Auth API`) and each individual test case (e.g., `POST /register`) is clearly marked.
*   The logs indicate the start and end of each test, along with the outcome (success or failure).
*   For failed tests, the log will contain the error message and a stack trace, which is essential for debugging.

**Example Log Output:**

```
[AUTH TEST] 2026-01-24T12:00:00.000Z: --- Testing POST /register ---
[AUTH TEST] 2026-01-24T12:00:01.500Z: User registration successful.
...
[AUTH TEST] 2026-01-24T12:00:05.200Z: --- Testing account lockout ---
[AUTH TEST] 2026-01-24T12:00:08.900Z: Account lockout successful.
```

If a test fails, you will see an entry like:
```
[AUTH TEST] 2026-01-24T12:00:10.100Z: Get user profile test failed: Request failed with status code 401
```

## 6. Writing New Tests

To add a new test script, create a new file in the `tests` directory with a `.test.ts` extension (e.g., `newfeature.test.ts`). The test runner will automatically discover and execute it.

Follow the existing structure in the test files as a template for new tests. Ensure you include detailed logging to aid in debugging.