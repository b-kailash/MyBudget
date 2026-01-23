#!/bin/bash

# API Integration Test Script for MyBudget Backend
# Usage: ./scripts/api-test.sh [BASE_URL]
# Example: ./scripts/api-test.sh http://192.168.1.235:3000

set -e

# Configuration
BASE_URL="${1:-http://192.168.1.235:3000}"
API_URL="$BASE_URL/api/v1"

# Generate unique test user to avoid conflicts
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser_${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPass123"
TEST_NAME="Test User $TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}TEST:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_failure() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: sudo apt-get install jq (Ubuntu) or brew install jq (Mac)"
    exit 1
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
fi

print_header "MyBudget API Integration Tests"
echo "Base URL: $BASE_URL"
echo "Test User: $TEST_EMAIL"
echo ""

# ============================================================================
# Test 1: Health Check
# ============================================================================
print_header "1. Health Check"

print_test "GET /health"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.data.status // empty')

if [ "$HEALTH_STATUS" = "ok" ]; then
    print_success "Health endpoint returned status: ok"
    echo "  Response: $HEALTH_RESPONSE"
else
    print_failure "Health endpoint failed"
    echo "  Response: $HEALTH_RESPONSE"
fi

# ============================================================================
# Test 2: Root Endpoint
# ============================================================================
print_header "2. Root Endpoint"

print_test "GET /"
ROOT_RESPONSE=$(curl -s "$BASE_URL/")
API_NAME=$(echo "$ROOT_RESPONSE" | jq -r '.name // empty')

if [ "$API_NAME" = "MyBudget API" ]; then
    print_success "Root endpoint returned API info"
else
    print_failure "Root endpoint failed"
    echo "  Response: $ROOT_RESPONSE"
fi

# ============================================================================
# Test 3: User Registration
# ============================================================================
print_header "3. User Registration"

print_test "POST /api/v1/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"name\": \"$TEST_NAME\",
        \"familyName\": \"Test Family $TIMESTAMP\"
    }")

REGISTER_USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.user.id // empty')
REGISTER_ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken // empty')

if [ -n "$REGISTER_USER_ID" ] && [ "$REGISTER_USER_ID" != "null" ]; then
    print_success "User registered successfully"
    print_info "User ID: $REGISTER_USER_ID"
else
    print_failure "User registration failed"
    echo "  Response: $REGISTER_RESPONSE"
fi

# ============================================================================
# Test 4: Duplicate Registration (should fail)
# ============================================================================
print_header "4. Duplicate Registration (Expected to Fail)"

print_test "POST /api/v1/auth/register (duplicate)"
DUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"name\": \"$TEST_NAME\",
        \"familyName\": \"Test Family $TIMESTAMP\"
    }")

DUP_ERROR=$(echo "$DUP_RESPONSE" | jq -r '.error.code // empty')

if [ "$DUP_ERROR" = "CONFLICT" ] || [ "$DUP_ERROR" = "USER_EXISTS" ] || [ "$DUP_ERROR" = "VALIDATION_ERROR" ]; then
    print_success "Duplicate registration correctly rejected"
else
    print_failure "Duplicate registration should have been rejected"
    echo "  Response: $DUP_RESPONSE"
fi

# ============================================================================
# Test 5: User Login
# ============================================================================
print_header "5. User Login"

print_test "POST /api/v1/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken // empty')
LOGIN_USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id // empty')

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    print_success "Login successful"
    print_info "Access token received (${#ACCESS_TOKEN} chars)"
    print_info "Refresh token received (${#REFRESH_TOKEN} chars)"
else
    print_failure "Login failed"
    echo "  Response: $LOGIN_RESPONSE"
    echo -e "${RED}Cannot continue tests without access token. Exiting.${NC}"
    exit 1
fi

# ============================================================================
# Test 6: Invalid Login (should fail)
# ============================================================================
print_header "6. Invalid Login (Expected to Fail)"

print_test "POST /api/v1/auth/login (wrong password)"
INVALID_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"WrongPassword123\"
    }")

INVALID_ERROR=$(echo "$INVALID_LOGIN" | jq -r '.error.code // empty')

if [ "$INVALID_ERROR" = "UNAUTHORIZED" ] || [ "$INVALID_ERROR" = "INVALID_CREDENTIALS" ]; then
    print_success "Invalid login correctly rejected"
else
    print_failure "Invalid login should have been rejected"
    echo "  Response: $INVALID_LOGIN"
fi

# ============================================================================
# Test 7: Get Accounts (Authenticated)
# ============================================================================
print_header "7. Get Accounts"

print_test "GET /api/v1/accounts"
ACCOUNTS_RESPONSE=$(curl -s "$API_URL/accounts" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

ACCOUNTS_DATA=$(echo "$ACCOUNTS_RESPONSE" | jq -r '.data // empty')

if [ -n "$ACCOUNTS_DATA" ] && [ "$ACCOUNTS_DATA" != "null" ]; then
    print_success "Accounts retrieved successfully"
    ACCOUNT_COUNT=$(echo "$ACCOUNTS_RESPONSE" | jq '.data | length')
    print_info "Account count: $ACCOUNT_COUNT"
else
    print_failure "Failed to get accounts"
    echo "  Response: $ACCOUNTS_RESPONSE"
fi

# ============================================================================
# Test 8: Create Account
# ============================================================================
print_header "8. Create Account"

print_test "POST /api/v1/accounts"
CREATE_ACCOUNT_RESPONSE=$(curl -s -X POST "$API_URL/accounts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
        "name": "Test Bank Account",
        "type": "BANK",
        "openingBalance": 1000.00,
        "currency": "USD"
    }')

ACCOUNT_ID=$(echo "$CREATE_ACCOUNT_RESPONSE" | jq -r '.data.id // empty')

if [ -n "$ACCOUNT_ID" ] && [ "$ACCOUNT_ID" != "null" ]; then
    print_success "Account created successfully"
    print_info "Account ID: $ACCOUNT_ID"
else
    print_failure "Failed to create account"
    echo "  Response: $CREATE_ACCOUNT_RESPONSE"
fi

# ============================================================================
# Test 9: Get Categories
# ============================================================================
print_header "9. Get Categories"

print_test "GET /api/v1/categories"
CATEGORIES_RESPONSE=$(curl -s "$API_URL/categories" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

CATEGORIES_DATA=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data // empty')

if [ -n "$CATEGORIES_DATA" ] && [ "$CATEGORIES_DATA" != "null" ]; then
    print_success "Categories retrieved successfully"
    CATEGORY_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq '.data | length')
    print_info "Category count: $CATEGORY_COUNT"
else
    print_failure "Failed to get categories"
    echo "  Response: $CATEGORIES_RESPONSE"
fi

# ============================================================================
# Test 10: Create Category
# ============================================================================
print_header "10. Create Category"

print_test "POST /api/v1/categories"
CREATE_CATEGORY_RESPONSE=$(curl -s -X POST "$API_URL/categories" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
        "name": "Test Groceries",
        "type": "EXPENSE",
        "icon": "cart",
        "color": "#4CAF50"
    }')

CATEGORY_ID=$(echo "$CREATE_CATEGORY_RESPONSE" | jq -r '.data.id // empty')

if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
    print_success "Category created successfully"
    print_info "Category ID: $CATEGORY_ID"
else
    print_failure "Failed to create category"
    echo "  Response: $CREATE_CATEGORY_RESPONSE"
fi

# ============================================================================
# Test 11: Create Transaction (if account and category exist)
# ============================================================================
print_header "11. Create Transaction"

if [ -n "$ACCOUNT_ID" ] && [ "$ACCOUNT_ID" != "null" ] && [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
    print_test "POST /api/v1/transactions"
    CREATE_TRANSACTION_RESPONSE=$(curl -s -X POST "$API_URL/transactions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "{
            \"accountId\": \"$ACCOUNT_ID\",
            \"categoryId\": \"$CATEGORY_ID\",
            \"amount\": 50.00,
            \"type\": \"EXPENSE\",
            \"currency\": \"USD\",
            \"payee\": \"Test Grocery Store\",
            \"description\": \"Test grocery purchase\",
            \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }")

    TRANSACTION_ID=$(echo "$CREATE_TRANSACTION_RESPONSE" | jq -r '.data.id // empty')

    if [ -n "$TRANSACTION_ID" ] && [ "$TRANSACTION_ID" != "null" ]; then
        print_success "Transaction created successfully"
        print_info "Transaction ID: $TRANSACTION_ID"
    else
        print_failure "Failed to create transaction"
        echo "  Response: $CREATE_TRANSACTION_RESPONSE"
    fi
else
    print_info "Skipping transaction test (no account or category)"
fi

# ============================================================================
# Test 12: Get Transactions
# ============================================================================
print_header "12. Get Transactions"

print_test "GET /api/v1/transactions"
TRANSACTIONS_RESPONSE=$(curl -s "$API_URL/transactions" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

TRANSACTIONS_DATA=$(echo "$TRANSACTIONS_RESPONSE" | jq -r '.data // empty')

if [ -n "$TRANSACTIONS_DATA" ] && [ "$TRANSACTIONS_DATA" != "null" ]; then
    print_success "Transactions retrieved successfully"
    # Handle both array and object with items
    if echo "$TRANSACTIONS_RESPONSE" | jq -e '.data | type == "array"' > /dev/null 2>&1; then
        TRANSACTION_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | jq '.data | length')
    else
        TRANSACTION_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | jq '.data.items | length // 0')
    fi
    print_info "Transaction count: $TRANSACTION_COUNT"
else
    print_failure "Failed to get transactions"
    echo "  Response: $TRANSACTIONS_RESPONSE"
fi

# ============================================================================
# Test 13: Get Budgets
# ============================================================================
print_header "13. Get Budgets"

print_test "GET /api/v1/budgets"
BUDGETS_RESPONSE=$(curl -s "$API_URL/budgets" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

BUDGETS_DATA=$(echo "$BUDGETS_RESPONSE" | jq -r '.data // empty')

if [ -n "$BUDGETS_DATA" ] && [ "$BUDGETS_DATA" != "null" ]; then
    print_success "Budgets retrieved successfully"
    BUDGET_COUNT=$(echo "$BUDGETS_RESPONSE" | jq '.data | length')
    print_info "Budget count: $BUDGET_COUNT"
else
    print_failure "Failed to get budgets"
    echo "  Response: $BUDGETS_RESPONSE"
fi

# ============================================================================
# Test 14: Unauthorized Access (no token)
# ============================================================================
print_header "14. Unauthorized Access (Expected to Fail)"

print_test "GET /api/v1/accounts (no token)"
UNAUTH_RESPONSE=$(curl -s "$API_URL/accounts")
UNAUTH_ERROR=$(echo "$UNAUTH_RESPONSE" | jq -r '.error.code // empty')

if [ "$UNAUTH_ERROR" = "UNAUTHORIZED" ]; then
    print_success "Unauthorized access correctly rejected"
else
    print_failure "Should have rejected unauthorized access"
    echo "  Response: $UNAUTH_RESPONSE"
fi

# ============================================================================
# Test 15: Token Refresh
# ============================================================================
print_header "15. Token Refresh"

print_test "POST /api/v1/auth/refresh"
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{
        \"refreshToken\": \"$REFRESH_TOKEN\"
    }")

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.accessToken // empty')

if [ -n "$NEW_ACCESS_TOKEN" ] && [ "$NEW_ACCESS_TOKEN" != "null" ]; then
    print_success "Token refresh successful"
    print_info "New access token received (${#NEW_ACCESS_TOKEN} chars)"
    ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
else
    print_failure "Token refresh failed"
    echo "  Response: $REFRESH_RESPONSE"
fi

# ============================================================================
# Test 16: Logout
# ============================================================================
print_header "16. Logout"

print_test "POST /api/v1/auth/logout"
LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

LOGOUT_SUCCESS=$(echo "$LOGOUT_RESPONSE" | jq -r '.data.message // .data.success // empty')

if [ -n "$LOGOUT_SUCCESS" ] || [ "$(echo "$LOGOUT_RESPONSE" | jq -r '.error')" = "null" ]; then
    print_success "Logout successful"
else
    print_failure "Logout failed"
    echo "  Response: $LOGOUT_RESPONSE"
fi

# ============================================================================
# Test Summary
# ============================================================================
print_header "Test Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo ""
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
