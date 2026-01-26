# Test Case: TS-007 - Reports & Analytics

## Description
Validate financial report generation, data aggregation, and dashboard summaries.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- User is authenticated.
- Transactions exist for the current month and previous months.

## Manual Test Steps

### 1. Monthly Summary
1. Send a `GET` request to `/reports/monthly-summary` with current `year` and `month`.
2. **Expected Result**: 
   - Status Code: 200 OK.
   - Response contains `totalIncome`, `totalExpenses`, and `netSavings`.
   - Data matches manual sum of transactions for the period.

### 2. Category Breakdown
1. Send a `GET` request to `/reports/category-breakdown?type=EXPENSE`.
2. **Expected Result**: 
   - Status Code: 200 OK.
   - Response is a sorted list of categories by spending amount.
   - Percentages sum up to 100%.

### 3. Trend Analysis
1. Send a `GET` request to `/reports/trend?months=6`.
2. **Expected Result**: 
   - Status Code: 200 OK.
   - Response contains 6 months of trend data.
   - Averages are calculated correctly.

### 4. Dashboard Overview
1. Send a `GET` request to `/dashboard` (proxied via `/reports` or separate route as defined in router).
2. **Expected Result**: 
   - Status Code: 200 OK.
   - Response includes summary, recent transactions (max 5), top categories, and current account balances.

### 5. Validation: Invalid Month
1. Send a `GET` request to `/reports/monthly-summary?month=13`.
2. **Expected Result**:
   - Status Code: 400 Bad Request.
   - Error: `Month must be between 1 and 12`.

## Automated Script
- **File**: `tests/testScripts/backend/TS-007_Reports.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-007_Reports.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
