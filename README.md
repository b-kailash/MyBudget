# MyBudget

A full-stack family budgeting application for tracking expenses, managing budgets, and gaining insights into your finances.

## Features

- **Multi-user Family Support** - Create families and invite members with role-based access (Admin, Member, Viewer)
- **Account Management** - Track multiple bank accounts, savings, and cards
- **Transaction Tracking** - Record income and expenses with categories and notes
- **Budget Management** - Set monthly budgets by category and track spending
- **Transaction Import** - Import transactions from CSV and Excel files
- **Dashboard & Reports** - Visual spending summaries and category breakdowns
- **Secure Authentication** - JWT-based auth with refresh tokens

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express, PostgreSQL, Prisma ORM |
| **Web Frontend** | React, TypeScript, Vite, React Query, Tailwind CSS |
| **Mobile** | React Native (Expo) - *planned* |
| **Shared** | TypeScript types, Zod validation, file parsers |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/b-kailash/MyBudget.git
cd MyBudget
npm install

# 2. Configure environment
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your database URL and JWT secrets

# 3. Build shared package
npm run build --workspace=packages/shared

# 4. Start database
docker compose -f docker-compose.dev.yml up -d

# 5. Run migrations
cd apps/backend && npx prisma migrate dev && cd ../..

# 6. Start the application
npm run dev --workspace=apps/backend   # Terminal 1
npm run dev --workspace=apps/web       # Terminal 2
```

**Access Points:**
- Web App: http://localhost:5173
- API: http://localhost:3000
- Health Check: http://localhost:3000/api/v1/health

## Project Structure

```
MyBudget/
├── apps/
│   ├── backend/        # Express API server
│   └── web/            # React web application
├── packages/
│   └── shared/         # Shared types, validation, parsers
├── tests/              # API integration tests
├── demo/               # Demo data seed scripts
└── Docs/               # Documentation
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Setup Guide](Docs/SETUP.md) | Complete installation and configuration |
| [Development Guide](Docs/DEVELOPMENT.md) | Running and developing the application |
| [Testing Guide](Docs/TESTING.md) | Running automated API tests |
| [Demo Data](demo/README.md) | Sample data for testing |
| [Specification](Docs/SPEC.md) | Full application specification |

## Available Scripts

**Root Level:**

| Command | Description |
|---------|-------------|
| `npm run dev --workspace=apps/backend` | Start backend dev server |
| `npm run dev --workspace=apps/web` | Start web dev server |
| `npm run build --workspace=packages/shared` | Build shared package |
| `npm run seed:demo` | Load demo data |
| `npm run lint` | Run ESLint across all packages |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |

## Demo Data

Load sample data for testing:

```bash
npm run seed:demo
```

Login credentials:
- **Email:** john@demo.mybudget.app
- **Password:** Demo123!

See [Demo Data README](demo/README.md) for all demo accounts.

## API Overview

All endpoints use the `/api/v1` prefix:

| Resource | Endpoints |
|----------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Accounts | `/accounts` - CRUD operations |
| Categories | `/categories` - CRUD with subcategories |
| Transactions | `/transactions` - CRUD with filtering |
| Budgets | `/budgets` - Monthly budget management |
| Family | `/family` - Member management |
| Import | `/import` - CSV/Excel transaction import |
| Reports | `/reports` - Spending summaries |

## License

Private - All rights reserved.
