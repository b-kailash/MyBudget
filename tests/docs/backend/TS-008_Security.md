# Test Case: TS-008 - Robustness & Security

## Description
Validate the application's resilience against common attacks, rate limiting, and invalid data injection.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- Backend API is running.
- Tools for load testing or rapid request firing (e.g., shell script or automated test).

## Manual Test Steps

### 1. Brute Force Protection (Rate Limiting)
1. Send 6 login requests within 60 seconds with incorrect credentials.
2. **Expected Result**: 
   - The first 5 requests return `401 Unauthorized`.
   - The 6th request returns `429 Too Many Requests`.
   - Error code: `RATE_LIMIT_EXCEEDED`.

### 2. JWT Tampering
1. Capture a valid `accessToken`.
2. Modify a single character in the signature or payload.
3. Attempt to access `/accounts` with the tampered token.
4. **Expected Result**:
   - Status Code: 401 Unauthorized.
   - Error message: `Invalid token`.

### 3. SQL Injection Protection
1. Attempt to create an account with a name like `' OR '1'='1`.
2. Attempt to filter transactions with a query param like `?type=EXPENSE'; DROP TABLE users;--`.
3. **Expected Result**:
   - Status Code: 400 Bad Request or 200 OK (if literal name).
   - Database remains intact; no command execution occurs.

### 4. XSS Protection in User Inputs
1. Create a transaction with notes containing `<script>alert('XSS')</script>`.
2. Retrieve the transaction and check the `notes` field.
3. **Expected Result**:
   - The script tag is either stripped, escaped, or safely stored as a literal string.
   - When rendered in a browser (manual check on web app if available), no alert should fire.

### 5. Large Payload Resilience
1. Attempt to upload a CSV file larger than 5MB to `/import/upload`.
2. **Expected Result**:
   - Status Code: 413 Payload Too Large (or similar multer limit error).

## Automated Script
- **File**: `tests/testScripts/backend/TS-008_Security.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-008_Security.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
