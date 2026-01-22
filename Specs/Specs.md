# Family Budgeting Application – Full Specification

## 1. Overview

Build a full-stack family budgeting application with:

- Multiple frontends:
  - Web SPA (React) for desktop and browser users.
  - Mobile app (React Native) that can work offline and sync when online.
- Backend:
  - Node.js + Express REST API.
  - PostgreSQL database.
  - Packaged as a Docker container (optionally with docker-compose for local dev).
- Source control:
  - Single GitHub repository (monorepo) containing frontend(s), backend, and shared code.

The app is for a single family or multiple families, with user accounts, shared budgets, and per-user views.

---

## 2. High-Level Architecture

- **Monorepo structure (suggested)**

  ```text
  /apps
    /web          # React web SPA
    /mobile       # React Native app (Expo)
    /backend      # Node.js + Express API
  /packages
    /shared       # Shared TypeScript types, validation, API client, utilities
  docker-compose.yml
  README.md

  ```

- **Common backend for all clients**
  - REST/JSON API.
  - Stateless auth (JWT or secure HTTP-only cookie sessions).
  - Same PostgreSQL database for browser and mobile frontends.

---

## 3. Functional Requirements

### 3.1 User \& Family Management

- Adults can register with email + password.
- Email/password login with secure password hashing.
- Each user belongs to one family.
- Roles:
  - `family_admin`: manage users, accounts, categories, budgets.
  - `member`: manage own transactions, view family data.
  - `viewer`: read-only access to family data.
- Profile fields:
  - Name, email, role, status (active/disabled), created_at.

### 3.2 Accounts \& Categories

- Accounts:
  - Fields: id, family_id, name, type (cash, bank, card, savings), currency, opening_balance, is_active.
  - CRUD operations restricted to `family_admin`.
- Categories:
  - Fields: id, family_id, name, type (income, expense, transfer), parent_id (optional for subcategories), color, icon.
  - CRUD operations for `family_admin`.
- Budgets:
  - Budgets per category and/or per account.
  - Fields: id, family_id, category_id, period_type (monthly, weekly, yearly), amount, start_date, end_date.

### 3.3 Transactions

- Fields: - id, family_id, account_id, category_id, user_id, type (income, expense, transfer),
  amount, currency, date, payee, notes, transfer_account_id (for internal transfers),
  created_at, updated_at.
- CRUD endpoints:
  - Create, read (list, detail), update, delete within a family.
- Recurring transactions:
  - Separate entity: id, template_transaction_id, frequency (weekly, monthly, yearly), next_run_at, end_date.
  - Backend job/cron endpoint to materialize due recurring transactions.

### 3.4 Budgeting \& Dashboards

- Monthly view:
  - Total income vs expenses.
  - Net savings.
  - Remaining vs budgeted per category.
- Visual indication when budget usage reaches thresholds (e.g. 80%, 100%).
- Dashboard widgets:
  - Recent transactions list.
  - Top spending categories for the current period.
  - Short trend chart (month-over-month totals).

### 3.5 Reporting

- Time-range filters (from_date, to_date).
- Filter by:
  - Category, account, family member.
- Reports:
  - Spending by category (aggregated).
  - Income by source.
  - Net balance over time.

### 3.6 Alerts \& Notifications (Phase 2)

- Alerts:
  - Budget overrun alerts.
  - Upcoming recurring transactions.
- For now, implement:
  - Internal “alerts” table and API.
  - Option to notify via email or in-app list later.

---

## 4. Offline \& Sync Requirements

### 4.1 Web (Browser)

- Primary behavior: online-first.
- Optional enhancement (later): PWA + IndexedDB for offline cache.
- Web app fetches everything from backend API; no local SQLite required.

### 4.2 Mobile (React Native)

- Mobile app must support:
  - Full offline usage for core flows:
    - Viewing last synced data.
    - Creating/editing/deleting transactions.
  - Local storage:
    - SQLite DB on device, with tables mirroring server entities (at least for transactions, accounts, categories, user, family).
  - Sync strategy:
    - Each record has:
      - UUID primary key.
      - `updated_at` timestamp.
      - `is_deleted` flag for soft deletes.
    - Local “changes/outbox” table tracking unsynced operations (create/update/delete).
    - Sync process:

1. On connectivity or manual trigger, push local unsynced changes to backend via batched endpoint(s).
2. Backend applies changes, resolves conflicts using “last write wins” based on `updated_at`.
3. Backend returns updated records; mobile client updates local SQLite tables. - Conflicts: - If both mobile and server updated same record, prefer latest `updated_at`.

---

## 5. Backend Specification

### 5.1 Tech Stack

- Node.js (LTS) + Express.
- TypeScript (preferred).
- PostgreSQL for persistent storage.
- ORM: Prisma or TypeORM (any widely used, migration-capable ORM is acceptable).
- Authentication:
  - JWT (access + optional refresh) or secure cookie sessions.
  - Password hashing with bcrypt or argon2.

### 5.2 API Design

- Base URL: `/api/v1`.
- Standard REST endpoints:
  - `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`.
  - `/families`, `/users`.
  - `/accounts`, `/categories`, `/budgets`.
  - `/transactions`, `/transactions/recurring`.
  - `/reports/...` (e.g. `/reports/monthly-summary`, `/reports/category-breakdown`).
  - `/sync` (for batched mobile sync: accepts lists of changed entities and returns authoritative versions).
- Response format:
  - JSON with consistent envelope:
    - `{ "data": ..., "error": null }` or `{ "data": null, "error": { "code": ..., "message": ... } }`.

### 5.3 Database Schema (High-Level)

Tables (minimum):

- `families`
- `users`
- `accounts`
- `categories`
- `budgets`
- `transactions`
- `recurring_transactions`
- `alerts` (optional for phase 2)

Include foreign keys with ON DELETE RESTRICT for critical entities and indexes on:

- `transactions.family_id, date`
- `transactions.account_id`
- `transactions.category_id`
- `transactions.user_id`

---

## 6. Frontend Specification – Web (React)

### 6.1 Tech Stack

- React (with hooks).
- React Router for routing.
- State management: React Query or SWR for server state, plus local context or Zustand for global app state.
- Styling:
  - Tailwind CSS or component library (MUI/Chakra) – pick one and be consistent.
- TypeScript (preferred).

### 6.2 Pages \& Components

- Auth:
  - Login, register, forgot password (basic form that calls backend).
- Dashboard:
  - Summary cards for income, expenses, savings.
  - Chart(s) for spending vs budget.
  - Recent transactions table.
- Transactions:
  - List with filters (date range, category, account, member).
  - Create/edit transaction form.
  - Simple CSV import page (manual mapping column->field).
- Accounts:
  - List of accounts + balances.
  - Account create/edit form.
- Categories \& Budgets:
  - Category list with tree view (parent/subcategories).
  - Budget configuration per category.
- Reports:
  - Category breakdown view.
  - Month-over-month trend view.

---

## 7. Frontend Specification – Mobile (React Native)

### 7.1 Tech Stack

- React Native, preferably via Expo.
- State management: same pattern as web (React Query + Zustand/Context) where possible.
- Offline storage:
  - SQLite (via Expo SQLite or another widely used RN SQLite library).
- Navigation:
  - React Navigation (stack + tab navigator).

### 7.2 Screens

- Auth:
  - Login/register.
- Home:
  - Summary of income/expense/savings and quick links.
- Transactions:
  - List + add/edit screens.
- Accounts \& Budgets:
  - Simplified views for mobile.
- Sync:
  - Background automatic sync on connectivity.
  - Settings screen with manual “sync now” button and last sync status.

---

## 8. Shared Package (`/packages/shared`)

- TypeScript types for core entities.
- API client functions for each backend endpoint.
- Validation schemas (Zod or Yup).
- Utilities:
  - Currency/date formatting.
  - Sync helpers (building change sets, merging server data).

---

## 9. Docker \& DevOps

- Dockerfile for backend:
  - Install dependencies, build TS, run migrations, start server.
- Optional Dockerfile for web (served by Node/NGINX or dev server).
- docker-compose.yml for local dev:
  - `backend` service.
  - `db` service (PostgreSQL).
  - `web` service (optional).
- GitHub repository:
  - GitHub Actions workflow (later) for CI:
    - Install dependencies.
    - Run tests.
    - Build backend and web.
    - Optionally build and push Docker image.

---

## 10. Testing \& Quality

- Unit tests for critical business logic (budgets, transaction totals).
- Basic integration tests for API endpoints (auth, transactions, reports).
- Linting and formatting: ESLint + Prettier.
- Type checking: TypeScript strict mode if possible.

---

## 11. Implementation Phases

1. Backend core (auth, families, accounts, categories, transactions).
2. Web frontend basic flows.
3. Mobile app basic flows (online only).
4. Add offline + sync in mobile.
5. Add reports and dashboards.
6. Add Docker \& CI.
7. Add PWA/offline for web (optional, later).
