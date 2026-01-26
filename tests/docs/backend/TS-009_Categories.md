# Test Case: TS-009 - Categories

## Description
Validate category management, including hierarchical relationships (parent/subcategories).

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- User is authenticated.

## Manual Test Steps

### 1. Create Parent Category
1. Send a `POST` request to `/categories` with:
   - `name`: "Groceries"
   - `type`: "EXPENSE"
   - `color`: "#FF5733"
   - `icon`: "shopping_cart"
2. **Expected Result**: 
   - Status Code: 201 Created.
   - `parentId` is null.

### 2. Create Sub-category
1. Send a `POST` request to `/categories` with:
   - `name`: "Fruits"
   - `type`: "EXPENSE"
   - `parentId`: [ID of Groceries]
2. **Expected Result**: 
   - Status Code: 201 Created.
   - `parentId` matches the parent.

### 3. List Categories
1. Send a `GET` request to `/categories`.
2. **Expected Result**: 
   - Status Code: 200 OK.
   - Both categories appear in the list.

### 4. Update Category
1. Send a `PUT` request to `/categories/{id}` with a new name.
2. **Expected Result**: 
   - Status Code: 200 OK.

### 5. Validation: Cross-type Parent
1. Attempt to create an `INCOME` sub-category under an `EXPENSE` parent.
2. **Expected Result**:
   - Status Code: 400 Bad Request (business logic constraint).

## Automated Script
- **File**: `tests/testScripts/backend/TS-009_Categories.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-009_Categories.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
