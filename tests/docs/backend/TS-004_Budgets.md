# Test Case: TS-004 - Budgets

## Description
Validate budget lifecycle including creation, monitoring, and administrative controls.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- User is authenticated and has `FAMILY_ADMIN` role.
- At least one active Category exists.

## Manual Test Steps

### 1. Create Budget
1. Send a `POST` request to `/budgets` with:
   - `categoryId`: [Valid ID]
   - `periodType`: "MONTHLY"
   - `amount`: 1000.00
   - `startDate`: "2024-01-01"
   - `endDate`: "2024-01-31"
2. **Expected Result**: 
   - Status Code: 201 Created
   - Response contains the budget object.

### 2. List Budgets
1. Send a `GET` request to `/budgets`.
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response contains the created budget.

### 3. Update Budget
1. Send a `PUT` request to `/budgets/{id}` with:
   - `amount`: 1200.00
2. **Expected Result**: 
   - Status Code: 200 OK
   - Response shows updated amount.

### 4. Delete Budget
1. Send a `DELETE` request to `/budgets/{id}`.
2. **Expected Result**: 
   - Status Code: 200 OK.

### 5. Role Security: Member Cannot Create Budget
1. Switch to a user with `FAMILY_MEMBER` role.
2. Attempt to `POST` to `/budgets`.
3. **Expected Result**:
   - Status Code: 403 Forbidden.

## Automated Script
- **File**: `tests/testScripts/backend/TS-004_Budgets.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-004_Budgets.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
