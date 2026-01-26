# Test Case: TS-003 - Transactions

## Description
Validate the transaction lifecycle including creation, listing with filters, updating, and deletion.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- User is authenticated.
- At least one active Account exists.
- At least one active Category exists.

## Manual Test Steps

### 1. Create Transaction
1. Send a `POST` request to `/transactions` with:
   - `accountId`: [Valid ID]
   - `categoryId`: [Valid ID]
   - `type`: "EXPENSE"
   - `amount`: 50.00
   - `currency`: "USD"
   - `date`: "2024-01-01"
   - `payee`: "Starbucks"
2. **Expected Result**: 
   - Status Code: 201 Created
   - Response contains the transaction object.

### 2. List Transactions with Filter
1. Send a `GET` request to `/transactions?type=EXPENSE`.
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response contains "Starbucks" transaction.
   - Pagination metadata is present.

### 3. Update Transaction
1. Send a `PUT` request to `/transactions/{id}` with:
   - `amount`: 55.00
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response shows the updated amount.

### 4. Security: Cross-Family Access
1. Try to access or modify a transaction belonging to another family.
2. **Expected Result**: 
   - Status Code: 404 or 403 Forbidden.

### 5. Transfer Transaction
1. Send a `POST` request to `/transactions` with `type`: "TRANSFER" and a `transferAccountId`.
2. **Expected Result**:
   - Status Code: 201 Created.

## Automated Script
- **File**: `tests/testScripts/backend/TS-003_Transactions.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-003_Transactions.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
