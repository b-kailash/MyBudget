# Ordered TODO List for MyBudget

Track progress by marking items with `[x]` when complete.

---

## 🚀 Session Restart Instructions

**To resume development in a new session:**

1. Read this file (`Specs/todo.md`) to see current progress
2. Read `Specs/Specs.md` for full specification
3. Check git status: `git status && git log --oneline -5`
4. Next task: **Phase 1F - Testing (Items 26-29)** OR skip to **Phase 2 - Web Frontend**

**Before running the backend:**

```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Run database migration (if not done)
cd apps/backend && npx prisma migrate dev --name initial_schema

# Start backend
npm run dev --workspace=apps/backend
```

**Last commit:** `4b91423` - feat(backend): complete backend API with auth and CRUD endpoints (Phases 1B-1E)

---

## Phase 0 – Repo & Tooling ✅

- [x] 1. Initialize GitHub repository (monorepo layout: `/apps`, `/packages`).
- [x] 2. Set up root `package.json` (workspaces), `.editorconfig`, `.gitignore`, `README.md`.
- [x] 3. Configure ESLint + Prettier + TypeScript base config shared across apps/packages.

---

## Phase 0.1 – Specification Analysis ✅

- [x] 4. Deep analysis of Specs.md and TODO.md for gaps and contradictions.
- [x] 5. Document architectural decisions:
  - Auth: JWT with access + refresh tokens
  - ORM: Prisma
  - Primary keys: UUID for sync-compatible entities
  - Soft deletes: `is_deleted` + `deleted_at` on syncable entities

---

## Phase 1 – Shared Types & Backend Skeleton ✅

> **Note:** Shared types created FIRST to avoid duplication between backend and frontends.

### Phase 1A – Shared Types Foundation ✅

- [x] 6. Create `/packages/shared` with core TypeScript types:
  - Entity types: User, Family, Account, Category, Transaction, Budget
  - API request/response types
  - Enums: UserRole, AccountType, TransactionType, BudgetPeriod
- [x] 7. Add Zod validation schemas for all entities in shared package.
- [x] 8. Add utility functions: currency formatting, date helpers.

### Phase 1B – Backend Setup ✅

- [x] 9. Create `/apps/backend` with TypeScript Node + Express skeleton.
- [x] 10. Configure Prisma ORM with PostgreSQL connection.
- [x] 11. Create `.env.example` with all required environment variables.
- [x] 12. Set up Express middleware: CORS, JSON parsing, error handling, request logging.

### Phase 1C – Database Schema ✅

- [x] 13. Define Prisma schema with all tables:
  - `families` (id uuid, name, created_at, updated_at)
  - `users` (id uuid, family_id, email, password_hash, name, role, status, created_at, updated_at, is_deleted, deleted_at)
  - `accounts` (id uuid, family_id, name, type, currency, opening_balance, is_active, created_at, updated_at, is_deleted, deleted_at)
  - `categories` (id uuid, family_id, name, type, parent_id, color, icon, created_at, updated_at, is_deleted, deleted_at)
  - `transactions` (id uuid, family_id, account_id, category_id, user_id, type, amount, currency, date, payee, notes, transfer_account_id, created_at, updated_at, is_deleted, deleted_at)
  - `budgets` (id uuid, family_id, category_id, account_id nullable, period_type, amount, start_date, end_date, created_at, updated_at)
  - `refresh_tokens` (id uuid, user_id, token_hash, expires_at, created_at, revoked_at)
- [x] 14. Add database indexes per spec (family_id+date, account_id, category_id, user_id on transactions).
- [x] 15. Run initial migration and verify schema.

### Phase 1D – Authentication ✅

- [x] 16. Implement password hashing utility (bcrypt).
- [x] 17. Implement JWT utilities (sign, verify, refresh token logic).
- [x] 18. Implement auth endpoints:
  - `POST /api/v1/auth/register` - Creates user AND new family (user becomes family_admin)
  - `POST /api/v1/auth/login` - Returns access + refresh tokens
  - `POST /api/v1/auth/logout` - Revokes refresh token
  - `POST /api/v1/auth/refresh` - Issues new access token
  - `GET /api/v1/auth/me` - Returns current user profile
- [x] 19. Implement auth middleware for protected routes.
- [x] 20. Add request validation middleware using Zod schemas from shared package.

### Phase 1E – Core CRUD Endpoints ✅

- [x] 21. Implement family-scoped middleware (extracts family_id from authenticated user).
- [x] 22. Implement accounts CRUD:
  - `GET /api/v1/accounts` - List accounts for family
  - `GET /api/v1/accounts/:id` - Get single account
  - `POST /api/v1/accounts` - Create account (family_admin only)
  - `PUT /api/v1/accounts/:id` - Update account (family_admin only)
  - `DELETE /api/v1/accounts/:id` - Soft delete account (family_admin only)
- [x] 23. Implement categories CRUD (same pattern, with parent_id support for subcategories).
- [x] 24. Implement budgets CRUD:
  - `GET /api/v1/budgets` - List budgets with optional category/account filter
  - `POST /api/v1/budgets` - Create budget (family_admin only)
  - `PUT /api/v1/budgets/:id` - Update budget
  - `DELETE /api/v1/budgets/:id` - Delete budget
- [x] 25. Implement transactions CRUD:
  - `GET /api/v1/transactions` - List with pagination, filters (date range, category, account, user)
  - `GET /api/v1/transactions/:id` - Get single transaction
  - `POST /api/v1/transactions` - Create transaction
  - `PUT /api/v1/transactions/:id` - Update transaction (own transactions for members)
  - `DELETE /api/v1/transactions/:id` - Soft delete transaction

### Phase 1F – Basic Testing & Validation

- [x] 26. Write unit tests for auth utilities (password hashing, JWT).
- [ ] 27. Write integration tests for auth endpoints.
- [ ] 28. Write integration tests for CRUD endpoints (accounts, categories, transactions).
- [x] 29. Add npm scripts: `test`, `test:watch`, `test:coverage`.

---

## Phase 2 – Web Frontend (React)

### Phase 2A – Setup & Auth

- [ ] 30. Create `/apps/web` with Vite + React + TypeScript.
- [ ] 31. Configure React Router, React Query, and Tailwind CSS.
- [ ] 32. Create API client using shared package types.
- [ ] 33. Implement auth context/provider with token storage.
- [ ] 34. Implement login page.
- [ ] 35. Implement register page (creates new family).
- [ ] 36. Implement protected route wrapper.

### Phase 2B – Core Pages

- [ ] 37. Implement dashboard page with placeholder widgets.
- [ ] 38. Implement accounts list page.
- [ ] 39. Implement account create/edit modal or page.
- [ ] 40. Implement categories list page (with tree view for subcategories).
- [ ] 41. Implement category create/edit form.
- [ ] 42. Implement budgets configuration page.
- [ ] 43. Implement transactions list page with filters.
- [ ] 44. Implement transaction create/edit form.

### Phase 2C – Dashboard & Reports

- [ ] 45. Implement dashboard summary cards (income, expenses, net savings).
- [ ] 46. Implement recent transactions widget.
- [ ] 47. Implement spending by category chart.
- [ ] 48. Implement basic reporting page with date range filter.
- [ ] 49. Implement category breakdown report.
- [ ] 50. Implement month-over-month trend chart.

---

## Phase 3 – Backend Reports & Dashboard APIs

- [ ] 51. Implement `/api/v1/reports/monthly-summary` endpoint.
- [ ] 52. Implement `/api/v1/reports/category-breakdown` endpoint.
- [ ] 53. Implement `/api/v1/reports/trend` endpoint (month-over-month).
- [ ] 54. Implement `/api/v1/dashboard` endpoint (aggregated data for dashboard widgets).
- [ ] 55. Wire web frontend reports to new endpoints.

---

## Phase 3A – Transaction Import from Financial Institutions

> **Note:** Import functionality allows users to bulk-import transactions from bank exports and financial software.

### Phase 3A-Backend – Import Endpoints & Parsers

- [ ] 56. Add `import_batches` table to track import history:
  - `id` (uuid), `family_id`, `user_id`, `filename`, `file_type`, `status` (pending, processing, completed, failed)
  - `total_rows`, `imported_count`, `skipped_count`, `error_count`
  - `created_at`, `completed_at`
- [ ] 57. Implement file parsers in shared package (`/packages/shared/src/parsers/`):
  - CSV parser with configurable column mapping
  - XLSX/XLS parser (using `xlsx` library)
  - OFX/QFX parser (Open Financial Exchange - standard bank export format)
  - QIF parser (Quicken Interchange Format)
- [ ] 58. Implement import endpoints:
  - `POST /api/v1/import/upload` - Upload file, returns parsed preview with detected columns
  - `POST /api/v1/import/preview` - Submit column mapping, returns transaction preview
  - `POST /api/v1/import/commit` - Confirm import, creates transactions in batch
  - `GET /api/v1/import/history` - List past imports for family
  - `GET /api/v1/import/:id` - Get import batch details with error log
- [ ] 59. Implement duplicate detection logic:
  - Match by date + amount + payee (fuzzy)
  - Flag potential duplicates in preview
  - Option to skip or import anyway
- [ ] 60. Add import validation:
  - Validate required fields (date, amount, account)
  - Auto-match categories by payee keywords (optional)
  - Currency validation against target account

### Phase 3A-Web – Import UI

- [ ] 61. Create import page with file upload (drag & drop + file picker).
- [ ] 62. Implement file type detection and parser selection.
- [ ] 63. Implement column mapping UI for CSV/Excel:
  - Show sample data from first 5 rows
  - Dropdowns to map columns to fields (date, amount, payee, notes, category)
  - Date format selector
  - Amount sign convention (negative = expense vs positive = expense)
- [ ] 64. Implement import preview table:
  - Show all parsed transactions
  - Highlight duplicates with warning icon
  - Allow row-level skip/include toggle
  - Show validation errors inline
- [ ] 65. Implement import confirmation and progress:
  - Summary of what will be imported
  - Progress bar during import
  - Results summary (imported, skipped, errors)
- [ ] 66. Add import history page showing past imports.

---

## Phase 4 – Mobile App (React Native) – Online Only

- [ ] 67. Initialize `/apps/mobile` with Expo + TypeScript.
- [ ] 68. Configure React Navigation (auth stack + main tab navigator).
- [ ] 69. Set up React Query and shared API client.
- [ ] 70. Implement login screen.
- [ ] 71. Implement register screen.
- [ ] 72. Implement home/dashboard screen.
- [ ] 73. Implement transactions list screen.
- [ ] 74. Implement transaction add/edit screen.
- [ ] 75. Implement accounts list screen.
- [ ] 76. Implement categories selection screen.
- [ ] 77. Implement basic settings screen.

---

## Phase 5 – Offline & Sync (Mobile)

### Phase 5A – Backend Sync Endpoint

- [ ] 78. Implement `/api/v1/sync` endpoint:
  - Accepts batched changes (creates, updates, deletes) with timestamps
  - Applies "last write wins" conflict resolution
  - Returns authoritative versions of changed records
  - Returns all records updated since client's last sync timestamp

### Phase 5B – Mobile SQLite & Repository Layer

- [ ] 79. Add Expo SQLite to mobile app.
- [ ] 80. Create SQLite schema mirroring server tables.
- [ ] 81. Implement repository layer that reads/writes to SQLite.
- [ ] 82. Implement "outbox" table for tracking unsynced local changes.

### Phase 5C – Sync Service

- [ ] 83. Implement sync service:
  - Push local outbox changes to server
  - Pull updated records from server
  - Merge server data into local SQLite
  - Clear synced items from outbox
- [ ] 84. Implement automatic background sync on connectivity change.
- [ ] 85. Add sync status UI and manual "sync now" button in settings.
- [ ] 86. Handle sync errors gracefully with retry logic.

---

## Phase 6 – Recurring Transactions & Alerts

### Phase 6A – Recurring Transactions

- [ ] 87. Add `recurring_transactions` table to Prisma schema.
- [ ] 88. Implement recurring transactions CRUD endpoints.
- [ ] 89. Implement backend job/cron to materialize due recurring transactions.
- [ ] 90. Add recurring transactions UI to web app.
- [ ] 91. Add recurring transactions UI to mobile app.

### Phase 6B – Alerts

- [ ] 92. Add `alerts` table to Prisma schema.
- [ ] 93. Implement alert generation for budget overruns (triggered on transaction create/update).
- [ ] 94. Implement alert generation for upcoming recurring transactions.
- [ ] 95. Implement alerts list endpoint.
- [ ] 96. Show alerts in web dashboard.
- [ ] 97. Show alerts in mobile app.

---

## Phase 7 – Docker & Local Orchestration

- [ ] 98. Write Dockerfile for backend (multi-stage: build + run).
- [ ] 99. Write Dockerfile for web (build + nginx serve).
- [ ] 100. Create `docker-compose.yml`:
  - `db` service (PostgreSQL 15)
  - `backend` service
  - `web` service
- [ ] 101. Add database healthcheck and startup dependency.
- [ ] 102. Verify full stack runs via `docker-compose up`.
- [ ] 103. Document Docker setup in README.

---

## Phase 8 – CI/CD

- [ ] 104. Create GitHub Actions workflow for PRs:
  - Install dependencies
  - Run lint
  - Run type checks
  - Run tests
  - Build backend and web
- [ ] 105. Create GitHub Actions workflow for main branch:
  - All PR checks
  - Build Docker images
  - (Optional) Push to container registry
- [ ] 106. Add branch protection rules for main.

---

## Phase 9 – Polish & Documentation

- [ ] 107. Improve error messages and user feedback on web.
- [ ] 108. Improve error messages and user feedback on mobile.
- [ ] 109. Add loading states and empty states to all list views.
- [ ] 110. Add rate limiting to backend API.
- [ ] 111. Write comprehensive README with:
  - Project overview
  - Local development setup (with and without Docker)
  - Environment variables reference
  - API documentation summary
- [ ] 112. Document future work section (PWA, multi-currency conversion, advanced analytics, email notifications).

---

## Future Work (Not in current scope)

- [ ] Password reset / forgot password flow (requires email service)
- [ ] Family member invite flow
- [ ] Email notifications for alerts
- [ ] PWA + IndexedDB for web offline support
- [ ] Multi-currency conversion with exchange rates
- [ ] Advanced analytics and custom reports
- [ ] Data export functionality (CSV, PDF reports)
- [ ] Bank API integrations (Plaid, Yodlee) for automatic transaction sync
- [ ] Receipt image attachment to transactions
- [ ] Mobile import functionality (currently web-only)

---

## Architectural Decisions Log

| Decision              | Choice                      | Rationale                                         |
| --------------------- | --------------------------- | ------------------------------------------------- |
| ORM                   | Prisma                      | Better TS types, simpler migrations, excellent DX |
| Auth                  | JWT + Refresh Tokens        | Works well for mobile, stateless backend          |
| Primary Keys          | UUID                        | Required for offline sync, prevents conflicts     |
| Soft Deletes          | `is_deleted` + `deleted_at` | Required for sync, data recovery                  |
| Password Hashing      | bcrypt                      | Industry standard, sufficient security            |
| Web Styling           | Tailwind CSS                | Utility-first, fast development                   |
| State Management      | React Query + Context       | Server state caching, minimal boilerplate         |
| Mobile Framework      | Expo                        | Easier setup, good SQLite support                 |
| Shared Package Timing | Phase 1A (before backend)   | Prevents type duplication                         |
| File Parsing          | xlsx + custom OFX/QIF       | xlsx is standard for Excel; OFX/QIF need custom   |
