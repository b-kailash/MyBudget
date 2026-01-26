# Test Case: TS-006 - Data Import

## Description
Validate the transaction import process from CSV files, including parsing, column mapping, and transaction creation.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- User is authenticated.
- An account exists for importing transactions into.
- A valid CSV file is available.

## Manual Test Steps

### 1. Upload CSV
1. Create a `test.csv` with:
   ```csv
   Date,Description,Amount
   2024-01-01,Grocery Store,-50.00
   2024-01-02,Salary,3000.00
   ```
2. Send a `POST` request to `/import/upload` as a multipart/form-data with the file.
3. **Expected Result**: 
   - Status Code: 200 OK.
   - Response contains `importId`, `headers` (Date, Description, Amount), and a `suggestedMapping`.

### 2. Preview Import
1. Send a `POST` request to `/import/preview` with the file and the mapping:
   ```json
   {
     "mapping": { "date": "Date", "payee": "Description", "amount": "Amount" },
     "dateFormat": "YYYY-MM-DD"
   }
   ```
2. **Expected Result**: 
   - Status Code: 200 OK.
   - Response shows 2 preview rows, "Grocery Store" as expense and "Salary" as income.

### 3. Commit Import
1. Send a `POST` request to `/import/commit` with:
   - `accountId`: [Valid ID]
   - `mapping`: { "date": "Date", "payee": "Description", "amount": "Amount" }
   - `file`: [The CSV File]
2. **Expected Result**: 
   - Status Code: 200 OK.
   - Response: `imported: 2`.

### 4. Verify Transactions
1. Send a `GET` request to `/transactions`.
2. **Expected Result**:
   - Status Code: 200 OK.
   - Both "Grocery Store" and "Salary" transactions exist in the database.

### 5. Handle Duplicate Import
1. Commit the same file again with `skipDuplicates: true`.
2. **Expected Result**:
   - Status Code: 200 OK.
   - Response: `imported: 0, skipped: 2`.

## Automated Script
- **File**: `tests/testScripts/backend/TS-006_Import.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-006_Import.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
