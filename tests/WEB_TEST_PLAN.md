# MyBudget Web Frontend Test Plan

## 1. Introduction
This plan is specifically for the Web Frontend (React SPA). It focuses on user experience, form functionality, navigation, and visual feedback.

## 2. Test Environment
- **Web Frontend URL**: `http://192.168.1.235:5173`
- **Backend API URL**: `http://192.168.1.235:3000/api/v1`
- **Recommended Browsers**: Chrome, Firefox, Safari, Edge.

## 3. Recommended Automated Framework: Playwright
**Playwright** is the recommended framework for frontend automation because:
- **Fast Execution**: It runs tests in parallel across multiple browsers.
- **Auto-Wait**: It waits for elements to be visible/actionable before clicking, reducing "flaky" tests.
- **Trace Viewer**: It provides a full recording of the test execution, including DOM snapshots and network logs.
- **Strong Typing**: Excellent TypeScript support.

### Setup Instructions (For Novice)
1. Install Playwright in the `tests/` directory:
   ```bash
   cd tests
   npm init playwright@latest
   ```
2. Run automated tests:
   ```bash
   npx playwright test
   ```

## 4. Frontend Test Suites

| ID | Suite Name | Focus |
|---|---|---|
| WTS-001 | [Authentication Interaction](./docs/web/WTS-001_Auth.md) | Login/Register flow and error messages. |
| WTS-002 | [Dashboard & Layout](./docs/web/WTS-002_Dashboard.md) | Navigation sidebar, summary cards, and responsiveness. |
| WTS-003 | [Transaction Management](./docs/web/WTS-003_Forms.md) | Form validations, date pickers, and category selectors. |

## 5. Novice Tester Checklist
- [ ] Verify that clicking "Login" with empty fields shows a validation error.
- [ ] Ensure the "Logout" button returns the user to the login screen.
- [ ] Check if the navigation sidebar collapses correctly on smaller screens.
- [ ] Confirm that adding a transaction immediately updates the balance on the dashboard.
