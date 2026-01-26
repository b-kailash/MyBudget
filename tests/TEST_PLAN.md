# MyBudget Comprehensive Test Plan

## 1. Introduction
This document outlines the comprehensive test plan for the MyBudget application. The goal is to ensure all features are robust, secure, and handle edge cases gracefully.

- **Machine IP**: `192.168.1.235`
- **Backend API**: `http://192.168.1.235:3000`
- **Web Frontend**: `http://192.168.1.235:5173`
- **Environment**: Testing on a local network environment.

## 2. Testing Objectives
- Validate all core business logic (Auth, Accounts, Transactions, Budgets, Family, Reports).
- Ensure security and access control (JWT, Middleware, Rate Limiting).
- Test edge cases and "breaking" scenarios (Invalid inputs, conflicts, unauthorized access).
- Provide clear documentation for manual testers to sign off on features.

## 3. Scope of Testing
The following modules are in scope:
- **Authentication & Authorization**: Registration, login, token refresh, password reset.
- **Account Management**: CRUD operations for financial accounts.
- **Transaction Tracking**: CRUD operations, filtering, and categorization.
- **Budgeting**: Budget creation, monitoring, and alerts.
- **Family Sharing**: Group management, member invitations, and shared access.
- **Data Import/Export**: Importing transactions from CSV/JSON.
- **Reporting**: Generating financial insights and summaries.
- **Web Frontend**: User Interface, Form Validations, Responsive Design, and Navigation.
- **API Robustness**: Rate limiting, error handling, and data validation.

## 4. Testing Methodology
### 4.1 Automated Testing
Automated scripts are located in `tests/testScripts/`. These scripts use Jest and Axios to hit the backend API and verify responses.
To run tests:
```bash
cd tests
npm test testScripts/<test-file>.test.ts
```

### 4.2 Manual Verification
Each automated test suite is accompanied by a manual test case document in `tests/docs/`. These documents provide:
- Test description
- Pre-conditions
- Step-by-step instructions
- Expected results
- Sign-off section

## 5. Test Suites

| ID | Suite Name | Description |
|---|---|---|
| TS-001 | [Authentication](./docs/backend/TS-001_Authentication.md) | Tests user lifecycle and security components. |
| TS-002 | [Account Management](./docs/backend/TS-002_Accounts.md) | Tests financial account operations. |
| TS-003 | [Transactions](./docs/backend/TS-003_Transactions.md) | Tests ledger entries and categorization. |
| TS-004 | [Budgets](./docs/backend/TS-004_Budgets.md) | Tests budget tracking and limits. |
| TS-005 | [Family & Sharing](./docs/backend/TS-005_Family.md) | Tests collaborative features. |
| TS-006 | [Data Import](./docs/backend/TS-006_Import.md) | Tests bulk data ingestion. |
| TS-007 | [Reports & Analytics](./docs/backend/TS-007_Reports.md) | Tests data aggregation and insights. |
| TS-008 | [Robustness & Security](./docs/backend/TS-008_Security.md) | Tests rate limiting, CSRF, and invalid inputs. |
| TS-009 | [Categories](./docs/backend/TS-009_Categories.md) | Tests hierarchical category management. |

## 5. Web Frontend Suites (Manual & Automated)
These tests focus on the user interface and browser interactions. Detailed instructions are provided in the [Web Test Plan](./WEB_TEST_PLAN.md).

| ID | Suite Name | Description |
|---|---|---|
| WTS-001 | [Web Authentication](./docs/web/WTS-001_Auth.md) | Login, Register, and Token Persistence. |
| WTS-002 | [Dashboard & Navigation](./docs/web/WTS-002_Dashboard.md) | UI layout and page switching. |
| WTS-003 | [Transaction Forms](./docs/web/WTS-003_Forms.md) | Form entry and error handling. |

## 6. Resources
- **Base URL**: `http://192.168.1.235:3000` (Backend API)
- **Frontend URL**: `http://192.168.1.235:5173` (Web SPA)
- **Database**: PostgreSQL (Prisma)
- **API Framework**: Jest, Axios
- **Web UI Framework**: Playwright (Recommended for Automated UI Tests)
