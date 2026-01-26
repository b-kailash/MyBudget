# Test Case: TS-002 - Account Management

## Description
Validate the creation, retrieval, updating, and deletion (CRUD) of financial accounts within a family context.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- User is authenticated and has the `FAMILY_ADMIN` role.

## Manual Test Steps

### 1. Create Account
1. Send a `POST` request to `/accounts` with:
   - `name`: "Main Checking"
   - `type`: "CASH" (or other valid type)
   - `currency`: "USD"
   - `openingBalance`: 1000.00
2. **Expected Result**: 
   - Status Code: 201 Created
   - Response contains the account object with a unique ID.

### 2. List Accounts
1. Send a `GET` request to `/accounts`.
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response is an array containing "Main Checking".

### 3. Get Account by ID
1. Send a `GET` request to `/accounts/{id}` using the ID from Step 1.
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response matches the created account.

### 4. Update Account
1. Send a `PUT` request to `/accounts/{id}` with:
   - `name`: "Updated Checking"
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response shows the name change.

### 5. Delete Account (Soft Delete)
1. Send a `DELETE` request to `/accounts/{id}`.
2. **Expected Result**: 
   - Status Code: 200 OK
3. Send a `GET` request to `/accounts/{id}`.
4. **Expected Result**:
   - Status Code: 404 Not Found (since it's soft deleted and filtered out).

### 6. Validation: Invalid Currency
1. Send a `POST` request to `/accounts` with an invalid `currency` (e.g., "INVALID").
2. **Expected Result**:
   - Status Code: 400 Bad Request
   - Error details specify validation failure.

## Automated Script
- **File**: `tests/testScripts/backend/TS-002_Accounts.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-002_Accounts.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
