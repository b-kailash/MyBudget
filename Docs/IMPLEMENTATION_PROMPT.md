# Implementation Prompt for MyBudget V2 Features

Use this prompt to guide an AI assistant in implementing the V2 features specified in `SPEC_V2_FEATURES.md`.

---

## Optimized Implementation Prompt

```
You are implementing new features for MyBudget, a family budgeting application.

## Project Context
- Monorepo structure: /apps/backend, /apps/web, /apps/mobile, /packages/shared
- Tech stack: Node.js + Express + Prisma + PostgreSQL (backend), React + Vite + Tailwind (web)
- Current state: Core CRUD complete (auth, accounts, categories, transactions, budgets)
- Documentation: Docs/SPEC.md (base spec), Docs/SPEC_V2_FEATURES.md (new features), Docs/TODO.md (task tracking)

## Implementation Order (follow strictly)

### Phase B: Containerization (do first - enables consistent dev environment)
1. Fix apps/backend/.env.example - add REFRESH_TOKEN_SECRET variable
2. Create apps/backend/Dockerfile (multi-stage: node:20-alpine build → production)
3. Create apps/web/Dockerfile (multi-stage: node:20-alpine build → nginx:alpine serve)
4. Create apps/web/nginx.conf for SPA routing (fallback to index.html)
5. Update docker-compose.yml with all services: db, backend, web
6. Create docker-compose.dev.yml with volume mounts for hot reload
7. Create mybudget.sh management script with: start, stop, restart, logs, status, build commands
8. Test full stack: docker-compose up --build

### Phase A: Modern UI (after containerization works)
1. Install shadcn/ui: npx shadcn-ui@latest init (in apps/web)
2. Configure tailwind.config.js with shadcn presets
3. Create design tokens: colors, spacing, typography in globals.css
4. Add dark mode: ThemeProvider with system/light/dark toggle
5. Refactor components in order: Layout → Forms → Tables → Cards → Charts
6. Add toast notifications (sonner or react-hot-toast)
7. Add skeleton loading states to all list views
8. Implement command palette (cmdk) for navigation

### Phase C: Advanced Budgeting (after UI is modernized)
1. Create Prisma migrations for new tables:
   - budget_periods, budget_lines, envelopes, envelope_allocations, category_metadata
2. Add Zod schemas in packages/shared for new entities
3. Implement backend endpoints in order:
   - Budget periods CRUD → Budget lines CRUD → Envelopes CRUD
   - Budget views: /budget/zero-based, /budget/fifty-thirty-twenty, /budget/cash-flow
4. Implement frontend pages:
   - BudgetPeriodPage (create/manage periods)
   - ZeroBasedBudgetView (allocate income to categories)
   - EnvelopesPage (visual envelope management)
   - GoalsPage (pay-yourself-first setup)
5. Add budget method switcher in user settings

### Phase D: Bank Integrations (final phase)
1. Create connected_accounts and account_sync_history tables
2. Implement provider abstraction layer (packages/shared/src/banking/)
3. Start with Nordigen (free tier):
   - Backend: token exchange, transaction fetch, consent management
   - Frontend: connection flow modal, account linking UI
4. Add transaction sync service (cron job every 4 hours)
5. Implement duplicate detection and auto-categorization
6. Add TrueLayer as secondary provider (better Irish bank coverage)

## Key Technical Requirements
- All new environment variables must be added to .env.example with comments
- All API endpoints follow existing pattern: /api/v1/[resource]
- All responses use envelope format: { data: ..., error: null }
- Use existing auth middleware and family-scoping patterns
- Add Zod validation for all new endpoints
- Write integration tests for critical paths
- Commit after each logical unit with descriptive message

## Files to Read First
1. Docs/SPEC_V2_FEATURES.md - Full specification of new features
2. Docs/TODO.md - Current progress and remaining tasks
3. apps/backend/src/routes/ - Existing API patterns
4. apps/web/src/pages/ - Existing frontend patterns
5. packages/shared/src/schemas/ - Existing validation patterns
```

---

## Quick Reference Commands

```bash
# Start development environment
./mybudget.sh start --dev

# View logs
./mybudget.sh logs --follow

# Run database migrations
./mybudget.sh migrate

# Build production images
./mybudget.sh build --prod

# Run tests
npm test --workspace=apps/backend
npm test --workspace=tests
```

---

## Checklist for Each Phase

### Phase B Checklist
- [ ] REFRESH_TOKEN_SECRET added to .env.example
- [ ] Backend Dockerfile builds successfully
- [ ] Web Dockerfile builds successfully
- [ ] docker-compose up starts all services
- [ ] Backend health check passes: curl http://localhost:3000/health
- [ ] Web accessible: http://localhost (via nginx)
- [ ] mybudget.sh script works for all commands

### Phase A Checklist
- [ ] shadcn/ui installed and configured
- [ ] Dark mode toggle working
- [ ] All existing pages use new component library
- [ ] Toast notifications for CRUD operations
- [ ] Skeleton loaders on all list pages
- [ ] No Tailwind utility classes in component JSX (use shadcn components)

### Phase C Checklist
- [ ] All new tables created via Prisma migration
- [ ] Zero-based budgeting flow works end-to-end
- [ ] Envelope funding/withdrawal works
- [ ] 50/30/20 view shows correct percentages
- [ ] Category metadata (need/want/savings) can be set
- [ ] Budget method preference saved per user

### Phase D Checklist
- [ ] Nordigen connection flow works
- [ ] Transactions sync from connected bank
- [ ] Duplicate detection flags existing transactions
- [ ] Auto-categorization rules can be defined
- [ ] Manual sync trigger works
- [ ] Connection can be disconnected cleanly
