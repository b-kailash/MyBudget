# MyBudget V2 Features Specification

This document specifies new features to be added to the MyBudget application. These features extend the base specification in `SPEC.md`.

---

## 1. Modern UI Overhaul

### 1.1 Design System

- **Component Library:** Migrate from raw Tailwind to a modern component library:
  - **Recommended:** shadcn/ui (built on Radix UI + Tailwind) for flexibility and modern aesthetics
  - **Alternative:** Headless UI + custom Tailwind components
- **Design Principles:**
  - Clean, minimal interface with generous whitespace
  - Consistent spacing scale (4px base unit)
  - Subtle shadows and rounded corners for depth
  - Smooth micro-animations for state transitions (150-300ms)
  - Dark mode support (system preference + manual toggle)

### 1.2 Visual Components

- **Cards:** Elevated card design with subtle borders and shadows
- **Forms:** Floating labels, inline validation, smooth focus states
- **Tables:** Alternating row colors, sticky headers, sortable columns
- **Charts:** Modern charting library (Recharts or Chart.js) with consistent color palette
- **Navigation:**
  - Collapsible sidebar with icons + labels
  - Breadcrumb navigation for nested views
  - Command palette (Cmd+K) for quick navigation
- **Feedback:**
  - Toast notifications for actions (success, error, info)
  - Skeleton loading states instead of spinners
  - Empty states with helpful illustrations and CTAs

### 1.3 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly tap targets (minimum 44x44px)
- Swipe gestures for common actions on mobile web

### 1.4 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- ARIA labels and roles
- Focus indicators
- Screen reader announcements for dynamic content

---

## 2. Full Containerization

### 2.1 Container Architecture

All services run in Docker containers, managed by Docker Compose.

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  nginx   │  │ backend  │  │   web    │  │ postgres │    │
│  │ (proxy)  │  │ (api)    │  │ (react)  │  │   (db)   │    │
│  │  :80/443 │  │  :3000   │  │  :5173   │  │  :5432   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Service Definitions

#### 2.2.1 Database Service (`db`)
- Image: `postgres:16-alpine`
- Persistent volume for data
- Health check: `pg_isready`
- Environment variables for credentials

#### 2.2.2 Backend Service (`backend`)
- Custom Dockerfile (multi-stage build)
- Depends on: `db` (healthy)
- Auto-runs Prisma migrations on startup
- Health check: `GET /health`
- Environment variables from `.env` file

#### 2.2.3 Web Frontend Service (`web`)
- Custom Dockerfile (multi-stage: build with Node, serve with Nginx)
- Depends on: `backend` (healthy)
- Static file serving with gzip compression
- Client-side routing support (fallback to index.html)

#### 2.2.4 Reverse Proxy Service (`nginx`) - Optional for Production
- Routes `/api/*` to backend
- Routes `/*` to web frontend
- SSL termination (for production)
- Rate limiting at edge

### 2.3 Docker Compose Files

- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development with hot reload
- `docker-compose.override.yml` - Local overrides (gitignored)

### 2.4 Dockerfile Requirements

**Backend Dockerfile:**
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
# Install dependencies, build TypeScript

# Stage 2: Production
FROM node:20-alpine AS production
# Copy built files, run with minimal footprint
# Health check, non-root user
```

**Web Dockerfile:**
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
# Install dependencies, build React app

# Stage 2: Serve
FROM nginx:alpine AS production
# Copy built static files to nginx
# Custom nginx.conf for SPA routing
```

### 2.5 Environment Configuration

- All secrets via environment variables (never in images)
- `.env.example` with all required variables documented
- **Fix Required:** Add `REFRESH_TOKEN_SECRET` to `apps/backend/.env.example`
- Separate `.env` files per environment: `.env.development`, `.env.production`

---

## 3. Automated Startup & Shutdown

### 3.1 Management Scripts

Create a unified CLI for managing the application stack.

#### 3.1.1 Main Script: `mybudget.sh`

```bash
./mybudget.sh [command] [options]

Commands:
  start       Start all services (or specify: --backend, --web, --db)
  stop        Stop all services gracefully
  restart     Restart all services
  status      Show status of all services
  logs        Tail logs (or specify service)
  build       Build all Docker images
  migrate     Run database migrations
  seed        Seed database with sample data
  test        Run test suite
  clean       Remove containers, volumes, and images

Options:
  --dev       Use development configuration (hot reload)
  --prod      Use production configuration
  --detach    Run in background (default for prod)
  --verbose   Show detailed output
```

#### 3.1.2 Script Features

- **Dependency checks:** Verify Docker, Docker Compose, Node.js versions
- **Environment validation:** Check required env vars before starting
- **Health checks:** Wait for services to be healthy before reporting success
- **Graceful shutdown:** SIGTERM with timeout, then SIGKILL
- **Log management:** Rotate logs, configurable retention
- **Color-coded output:** Success (green), warning (yellow), error (red)

### 3.2 Makefile Alternative

For users who prefer Make:

```makefile
.PHONY: start stop restart logs build test

start:
	docker-compose up -d

stop:
	docker-compose down

dev:
	docker-compose -f docker-compose.dev.yml up

logs:
	docker-compose logs -f

# etc.
```

### 3.3 npm Scripts Integration

Add to root `package.json`:

```json
{
  "scripts": {
    "docker:start": "./mybudget.sh start",
    "docker:stop": "./mybudget.sh stop",
    "docker:dev": "./mybudget.sh start --dev",
    "docker:logs": "./mybudget.sh logs",
    "docker:build": "./mybudget.sh build"
  }
}
```

---

## 4. Advanced Budgeting Engine

### 4.1 Core Data Model: Zero-Based + Digital Envelopes

The budgeting engine uses a unified, flexible data model that supports multiple budgeting methodologies as "views" over the same underlying structure.

#### 4.1.1 New Database Entities

**Budget Periods (`budget_periods`)**
```
id              UUID PRIMARY KEY
family_id       UUID REFERENCES families
name            VARCHAR(100)          -- e.g., "January 2025"
start_date      DATE
end_date        DATE
status          ENUM('planning', 'active', 'closed')
total_income    DECIMAL(12,2)         -- Expected income for period
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**Budget Lines (`budget_lines`)**
```
id              UUID PRIMARY KEY
budget_period_id UUID REFERENCES budget_periods
category_id     UUID REFERENCES categories
budgeted_amount DECIMAL(12,2)         -- Amount allocated
funded_amount   DECIMAL(12,2)         -- Amount actually funded (for envelopes)
spent_amount    DECIMAL(12,2)         -- Computed from transactions
rollover_amount DECIMAL(12,2)         -- Carried from previous period
priority        INTEGER               -- For pay-yourself-first ordering
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**Envelopes / Buckets (`envelopes`)**
```
id              UUID PRIMARY KEY
family_id       UUID REFERENCES families
name            VARCHAR(100)          -- e.g., "Emergency Fund", "Vacation"
target_amount   DECIMAL(12,2)         -- Goal amount (optional)
target_date     DATE                  -- Goal date (optional)
current_balance DECIMAL(12,2)         -- Funded amount
color           VARCHAR(7)            -- Hex color
icon            VARCHAR(50)
is_goal         BOOLEAN               -- True for savings goals
auto_fund_amount DECIMAL(12,2)        -- For pay-yourself-first
auto_fund_priority INTEGER            -- Funding order
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**Envelope Allocations (`envelope_allocations`)**
```
id              UUID PRIMARY KEY
envelope_id     UUID REFERENCES envelopes
transaction_id  UUID REFERENCES transactions (nullable)
amount          DECIMAL(12,2)         -- Positive = fund, negative = withdraw
note            VARCHAR(255)
created_at      TIMESTAMP
```

**Category Metadata (`category_metadata`)**
```
category_id     UUID PRIMARY KEY REFERENCES categories
budget_class    ENUM('need', 'want', 'savings')  -- For 50/30/20
envelope_id     UUID REFERENCES envelopes (nullable)
is_trackable    BOOLEAN DEFAULT true  -- For no-budget mode
```

### 4.2 Budgeting Method Views

All methods use the same underlying data; they differ in presentation and workflow.

#### 4.2.1 Zero-Based Budgeting (Default)

- **Principle:** Every dollar has a job; income minus budgeted equals zero
- **Workflow:**
  1. Create budget period (usually monthly)
  2. Enter expected income
  3. Allocate to categories until remaining = $0
  4. Track spending against allocations
  5. Reallocate as needed during period
- **UI Elements:**
  - "To Be Budgeted" prominently displayed
  - Category groups with subtotals
  - Progress bars per category
  - Quick reallocation between categories

#### 4.2.2 Digital Envelopes

- **Principle:** Money is physically moved into virtual envelopes
- **Workflow:**
  1. Income arrives → shows as "Ready to Assign"
  2. Drag/assign money to envelopes
  3. Spending pulls from envelope balance
  4. Overspending shows negative balance (covered from other envelopes)
- **UI Elements:**
  - Visual envelope cards with balances
  - Drag-and-drop funding interface
  - "Move Money" modal between envelopes
  - Envelope balance history chart

#### 4.2.3 50/30/20 View

- **Principle:** Spending guideline (50% needs, 30% wants, 20% savings)
- **Implementation:**
  - Each category tagged as `need`, `want`, or `savings`
  - Computed view aggregates spending by class
  - Shows actual vs. target percentages
- **UI Elements:**
  - Three-column or donut chart visualization
  - Per-class drill-down to categories
  - Suggestions when out of balance
  - "What-if" calculator for adjustments

#### 4.2.4 Pay-Yourself-First

- **Principle:** Savings goals funded before discretionary spending
- **Workflow:**
  1. Define savings goals (envelopes with targets)
  2. Set auto-fund amounts and priorities
  3. When income received:
     - System suggests funding goals in priority order
     - Remaining goes to regular budget
  4. One-click "Fund My Goals" action
- **UI Elements:**
  - Goals dashboard with progress rings
  - Priority ordering (drag to reorder)
  - "Paycheck Wizard" for income allocation
  - Projected goal completion dates

#### 4.2.5 No-Budget Mode (Cash Flow Tracking)

- **Principle:** No allocation required; just track and analyze
- **Features:**
  - Transactions categorized but not budgeted
  - Focus on trends and insights
  - Category spending over time
  - Income vs. expense summary
  - Anomaly detection (unusual spending)
- **UI Elements:**
  - Simplified dashboard without budget bars
  - Trend charts prominent
  - "Insights" cards (e.g., "You spent 20% more on dining this month")
  - Optional category limits (alerts only, not hard budgets)

### 4.3 API Endpoints

```
# Budget Periods
GET    /api/v1/budget-periods
POST   /api/v1/budget-periods
GET    /api/v1/budget-periods/:id
PUT    /api/v1/budget-periods/:id
DELETE /api/v1/budget-periods/:id

# Budget Lines
GET    /api/v1/budget-periods/:id/lines
POST   /api/v1/budget-periods/:id/lines
PUT    /api/v1/budget-lines/:id
DELETE /api/v1/budget-lines/:id
POST   /api/v1/budget-lines/reallocate  # Move between categories

# Envelopes
GET    /api/v1/envelopes
POST   /api/v1/envelopes
GET    /api/v1/envelopes/:id
PUT    /api/v1/envelopes/:id
DELETE /api/v1/envelopes/:id
POST   /api/v1/envelopes/:id/fund       # Add money
POST   /api/v1/envelopes/:id/withdraw   # Remove money
POST   /api/v1/envelopes/transfer       # Move between envelopes

# Budgeting Views
GET    /api/v1/budget/zero-based/:periodId
GET    /api/v1/budget/fifty-thirty-twenty
GET    /api/v1/budget/goals-progress
GET    /api/v1/budget/cash-flow

# Category Metadata
PUT    /api/v1/categories/:id/metadata
```

### 4.4 User Preferences

```
# User budgeting preferences (stored in user_preferences table)
{
  "default_budget_method": "zero-based" | "envelopes" | "fifty-thirty-twenty" | "no-budget",
  "show_budget_method_switcher": true,
  "auto_create_monthly_period": true,
  "rollover_unused_budget": true,
  "envelope_overspend_behavior": "warn" | "block" | "allow"
}
```

---

## 5. Bank API Integrations

### 5.1 Overview

In addition to file imports (CSV, OFX, etc.), support automatic transaction sync via bank APIs and open banking aggregators.

### 5.2 Supported Providers

#### 5.2.1 Plaid (Primary - US, Canada, UK, EU)
- **Coverage:** 12,000+ financial institutions
- **Features:** Transactions, balances, account info, identity verification
- **Integration:** Plaid Link (frontend SDK) + API (backend)

#### 5.2.2 Yodlee (Alternative - Global)
- **Coverage:** 17,000+ financial institutions globally
- **Features:** Similar to Plaid, broader international coverage
- **Integration:** FastLink (frontend) + API (backend)

#### 5.2.3 Open Banking APIs (EU/UK - PSD2 Compliant)

PSD2-compliant providers that offer direct bank connectivity across Europe.

| Provider | Coverage | Key Features | Pricing |
|----------|----------|--------------|---------|
| **TrueLayer** | UK, EU (2,500+ banks) | AIS, PIS, VRP, strong UK coverage | Per API call |
| **Tink** | EU-wide (3,400+ banks) | Acquired by Visa, comprehensive EU | Enterprise |
| **Nordigen / GoCardless** | EU (2,300+ banks) | Free tier (50 connections), 90-day refresh | Free / Paid |
| **Enable Banking** | Nordics, EU (2,800+ banks) | Strong Nordic coverage, PSD2 native | Per connection |
| **Salt Edge** | Global (5,000+ sources) | Broad coverage, PSD2 + screen scraping fallback | Volume-based |
| **Yapily** | UK, EU (1,800+ banks) | Developer-friendly, real-time payments | Per API call |
| **Finicity** (Mastercard) | US, Canada, UK | Part of Mastercard Open Banking | Enterprise |

#### 5.2.4 Ireland & UK Specific Providers

| Provider | Coverage | Notes |
|----------|----------|-------|
| **TrueLayer** | All major Irish banks (AIB, BOI, PTSB, Ulster, KBC) | Best Irish coverage |
| **Enable Banking** | Irish banks + Credit Unions | Good credit union support |
| **Nordigen** | AIB, Bank of Ireland, PTSB, Revolut Ireland | Free tier available |
| **Token.io** | UK/EU banks | PSD2 native, payment initiation focus |
| **Moneyhub** | UK-focused | Consumer app + B2B API |

#### 5.2.5 Regional Providers (Non-EU)

| Region | Providers | Notes |
|--------|-----------|-------|
| **Australia** | Basiq, Frollo | CDR (Consumer Data Right) compliant |
| **India** | Setu Account Aggregator, Finvu | RBI-licensed AA ecosystem |
| **Brazil** | Belvo, Pluggy | Open Finance Brasil compliant |
| **Mexico** | Belvo, Paybook | Growing open banking adoption |
| **Canada** | Flinks, Inverite | No mandated open banking yet |
| **South Africa** | Stitch | Emerging market leader |

#### 5.2.6 Provider Selection Criteria

For EU/Ireland deployments, recommended priority:

1. **Nordigen (GoCardless)** - Start here for free tier, good Irish bank coverage
2. **TrueLayer** - Best UX and Irish bank coverage, paid
3. **Enable Banking** - If Nordic banks or Irish credit unions needed
4. **Salt Edge** - Fallback for banks not covered by PSD2 providers

### 5.3 Data Model Extensions

**Connected Accounts (`connected_accounts`)**
```
id                  UUID PRIMARY KEY
account_id          UUID REFERENCES accounts
family_id           UUID REFERENCES families
provider            ENUM('plaid', 'yodlee', 'truelayer', 'nordigen', 'enable_banking', 'salt_edge', 'yapily', 'tink', 'token_io', 'basiq', 'setu', 'belvo')
provider_account_id VARCHAR(255)        -- External account ID
provider_item_id    VARCHAR(255)        -- Connection/item ID
access_token_enc    TEXT                -- Encrypted access token
refresh_token_enc   TEXT                -- Encrypted refresh token (if applicable)
token_expires_at    TIMESTAMP
institution_id      VARCHAR(100)
institution_name    VARCHAR(255)
last_sync_at        TIMESTAMP
sync_status         ENUM('active', 'error', 'disconnected', 'pending_reauth')
error_message       TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Sync History (`account_sync_history`)**
```
id                  UUID PRIMARY KEY
connected_account_id UUID REFERENCES connected_accounts
sync_started_at     TIMESTAMP
sync_completed_at   TIMESTAMP
status              ENUM('success', 'partial', 'failed')
transactions_added  INTEGER
transactions_updated INTEGER
error_details       JSONB
```

### 5.4 Security Requirements

- **Token Storage:** All provider tokens encrypted at rest (AES-256)
- **Key Management:** Encryption keys in environment variables or secrets manager
- **Token Refresh:** Background job to refresh tokens before expiry
- **Audit Logging:** Log all sync operations (without sensitive data)
- **User Consent:** Clear UI explaining data access before connection
- **Revocation:** Users can disconnect accounts at any time
- **Data Retention:** Option to delete synced transactions on disconnect

### 5.5 API Endpoints

```
# Provider connections
GET    /api/v1/connections                 # List connected accounts
POST   /api/v1/connections/link-token      # Get Plaid/Yodlee link token
POST   /api/v1/connections                 # Save connection after linking
DELETE /api/v1/connections/:id             # Disconnect account
POST   /api/v1/connections/:id/refresh     # Force token refresh

# Sync operations
POST   /api/v1/connections/:id/sync        # Manual sync trigger
GET    /api/v1/connections/:id/sync-history

# Institution search
GET    /api/v1/institutions?query=...&country=...
```

### 5.6 Sync Workflow

1. **Connection Flow:**
   - User clicks "Connect Bank Account"
   - Backend generates link token (provider-specific)
   - Frontend opens provider's secure UI (Plaid Link, etc.)
   - User authenticates with their bank
   - Provider returns public token
   - Backend exchanges for access token
   - Store encrypted token, create `connected_account`

2. **Transaction Sync:**
   - Scheduled job runs every 4-6 hours
   - For each connected account:
     - Check token validity, refresh if needed
     - Fetch transactions since last sync
     - Match/dedupe against existing transactions
     - Create new transactions (pending user review or auto-import based on preference)
     - Update account balance

3. **Error Handling:**
   - Token expired → mark as `pending_reauth`, notify user
   - Rate limited → exponential backoff
   - Institution down → retry later, log error
   - User revoked access → mark as `disconnected`

### 5.7 User Preferences

```json
{
  "auto_import_synced_transactions": true,  // vs. review first
  "sync_frequency": "daily" | "twice_daily" | "manual",
  "default_category_rules": [
    { "payee_contains": "NETFLIX", "category_id": "uuid-entertainment" }
  ],
  "notification_on_large_transaction": 500.00
}
```

### 5.8 Cost Considerations

| Provider | Pricing Model | Free Tier | Notes |
|----------|--------------|-----------|-------|
| **Nordigen (GoCardless)** | Per connection | 50 connections free | Best for starting out, 90-day consent refresh |
| **TrueLayer** | Per API call | Limited sandbox | ~£0.10-0.30 per call, best Irish coverage |
| **Enable Banking** | Per connection/month | Sandbox only | ~€0.50-1.00 per connection, good Nordic coverage |
| **Salt Edge** | Volume-based | 100 test connections | Starts ~$0.10 per connection |
| **Yapily** | Per API call | Sandbox | Pay-as-you-go, developer-friendly |
| **Tink** | Enterprise | No | Contact sales, owned by Visa |
| **Plaid** | Per connection/month | Sandbox | ~$0.30-$1.50/connection, best US coverage |
| **Yodlee** | Enterprise | No | Contact sales, broadest global coverage |
| **Basiq** (AU) | Per connection | 50 free | ~$0.50/connection/month |

**Recommendations by Region:**

| Region | Primary | Fallback | Rationale |
|--------|---------|----------|-----------|
| **Ireland** | Nordigen (free) → TrueLayer | Salt Edge | Good coverage, TrueLayer has best AIB/BOI support |
| **UK** | Nordigen → TrueLayer | Yapily | All have excellent UK coverage |
| **EU (Nordics)** | Enable Banking | Nordigen | Enable has best Nordic bank support |
| **EU (General)** | Nordigen | Tink / Salt Edge | Nordigen free tier, Tink for enterprise |
| **US** | Plaid | Yodlee | Plaid has best UX and coverage |
| **Australia** | Basiq | Frollo | CDR-compliant, good free tier |

**Cost Control Strategy:** Allow users to provide their own API keys for paid providers, or use the free Nordigen tier for personal use.

---

## 6. Environment Variable Updates

### 6.1 Required Additions to `.env.example`

```bash
# === Authentication ===
JWT_SECRET=your_jwt_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars  # ADD THIS

# === Bank API Integrations ===

# Active provider (choose one as primary)
BANK_SYNC_PROVIDER=nordigen  # nordigen, truelayer, enable_banking, plaid, etc.

# Nordigen / GoCardless (recommended for EU/Ireland - FREE TIER)
# https://bankaccountdata.gocardless.com/
NORDIGEN_SECRET_ID=
NORDIGEN_SECRET_KEY=

# TrueLayer (recommended for Ireland/UK - PAID)
# https://console.truelayer.com/
TRUELAYER_CLIENT_ID=
TRUELAYER_CLIENT_SECRET=
TRUELAYER_ENV=sandbox  # sandbox, live

# Enable Banking (recommended for Nordics/EU)
# https://enablebanking.com/
ENABLE_BANKING_APP_ID=
ENABLE_BANKING_PRIVATE_KEY=

# Salt Edge (broad EU coverage, fallback option)
# https://www.saltedge.com/
SALT_EDGE_APP_ID=
SALT_EDGE_SECRET=

# Yapily (UK/EU, developer-friendly)
# https://www.yapily.com/
YAPILY_APPLICATION_ID=
YAPILY_SECRET=

# Plaid (recommended for US/Canada)
# https://dashboard.plaid.com/
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox  # sandbox, development, production

# Yodlee (enterprise, global coverage)
YODLEE_CLIENT_ID=
YODLEE_SECRET=

# Basiq (Australia only)
# https://dashboard.basiq.io/
BASIQ_API_KEY=

# Token encryption key (generate with: openssl rand -base64 32)
TOKEN_ENCRYPTION_KEY=

# === Feature Flags ===
ENABLE_BANK_SYNC=false
ENABLE_ADVANCED_BUDGETING=true
BANK_SYNC_AUTO_IMPORT=false  # Auto-import or require user review
```

---

## 7. Implementation Phases (New Features)

### Phase A: Modern UI (2-3 weeks)
1. Install and configure shadcn/ui
2. Create design tokens and theme
3. Refactor existing components to new design system
4. Add dark mode support
5. Implement loading states and animations
6. Accessibility audit and fixes

### Phase B: Full Containerization (1 week)
1. Create production Dockerfiles
2. Update docker-compose files
3. Create `mybudget.sh` management script
4. Fix `.env.example` (add REFRESH_TOKEN_SECRET)
5. Test full stack in containers
6. Document deployment process

### Phase C: Advanced Budgeting Engine (3-4 weeks)
1. Database migrations for new entities
2. Budget periods and lines API
3. Envelopes/buckets API
4. Zero-based budgeting UI
5. 50/30/20 view computation and UI
6. Pay-yourself-first workflow
7. No-budget mode dashboard
8. User preference management

### Phase D: Bank API Integrations (2-3 weeks)
1. Provider abstraction layer
2. Plaid integration (Link + API)
3. Transaction sync service
4. Connected accounts management UI
5. Auto-categorization rules
6. (Optional) Additional providers

---

## 8. Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Library | shadcn/ui | Modern, accessible, Tailwind-based, highly customizable |
| Budgeting Model | Zero-based + Envelopes | Most flexible foundation; methods are views |
| Primary Bank Provider | Plaid or Nordigen | Best coverage (Plaid) or free tier (Nordigen) |
| Token Encryption | AES-256-GCM | Industry standard for sensitive data at rest |
| Container Orchestration | Docker Compose | Simple, sufficient for single-server deployment |
| Script Language | Bash | Universal, no additional dependencies |
