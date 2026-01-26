# Test Case: TS-001 - Authentication

## Description
Validate the user lifecycle including registration, login, token management, and security constraints.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- Database is clean or supports unique user creation.

## Manual Test Steps

### 1. User Registration
1. Send a `POST` request to `/auth/register` with:
   - `email`: unique_email@example.com
   - `password`: StrongPassword123!
   - `name`: Test User
   - `familyName`: Test Family
2. **Expected Result**: 
   - Status Code: 201 Created
   - Response includes `accessToken` and `refreshToken`.
   - User object matches input.

### 2. Duplicate Registration
1. Send a `POST` request to `/auth/register` with the same email used in Step 1.
2. **Expected Result**: 
   - Status Code: 409 Conflict
   - Error code: `USER_EXISTS`
   - Detailed error message explaining the conflict.

### 3. User Login
1. Send a `POST` request to `/auth/login` with correct credentials.
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response includes a new `accessToken`.

### 4. Invalid Login
1. Send a `POST` request to `/auth/login` with an incorrect password.
2. **Expected Result**:
   - Status Code: 401 Unauthorized
   - Error message indicating invalid credentials.

### 5. Token Refresh
1. Send a `POST` request to `/auth/refresh` with the `refreshToken` from Step 1.
2. **Expected Result**:
   - Status Code: 200 OK
   - Response includes a new `accessToken`.

### 6. Security: Unauthorized Access
1. Send a `GET` request to any protected route (e.g., `/accounts`) without a Bearer token.
2. **Expected Result**:
   - Status Code: 401 Unauthorized
   - Error message: `Authentication required`.

## Automated Script
- **File**: `tests/testScripts/backend/TS-001_Authentication.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-001_Authentication.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
