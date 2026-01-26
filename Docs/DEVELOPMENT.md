# MyBudget Development Guide

Guide for running and developing the MyBudget application.

## Running the Application

### Prerequisites

Ensure you've completed the [Setup Guide](SETUP.md) first.

### Start All Services

**Terminal 1 - Database:**
```bash
docker compose -f docker-compose.dev.yml up -d
```

**Terminal 2 - Backend API:**
```bash
npm run dev --workspace=apps/backend
```

**Terminal 3 - Web Frontend:**
```bash
npm run dev --workspace=apps/web
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:5173 | React frontend |
| API | http://localhost:3000 | Backend REST API |
| API Docs | http://localhost:3000/api/v1/health | Health check endpoint |

## Project Structure

```
MyBudget/
├── apps/
│   ├── backend/          # Node.js + Express API
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/
│   │   │   └── lib/      # Utilities
│   │   └── prisma/       # Database schema
│   └── web/              # React + Vite frontend
│       ├── src/
│       │   ├── pages/    # Page components
│       │   ├── components/
│       │   ├── contexts/ # React contexts
│       │   └── lib/      # API client, utilities
│       └── public/
├── packages/
│   └── shared/           # Shared TypeScript code
│       └── src/
│           ├── types/    # Entity types
│           ├── schemas/  # Zod validation
│           └── parsers/  # CSV/XLSX parsers
├── demo/                 # Demo data and seed scripts
├── tests/                # Integration tests
└── Docs/                 # Documentation
```

## Development Workflow

### Making Backend Changes

1. Edit files in `apps/backend/src/`
2. The server auto-restarts on save (nodemon)
3. Test with curl or Postman:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

### Making Frontend Changes

1. Edit files in `apps/web/src/`
2. Vite hot-reloads automatically
3. Check browser console for errors

### Making Shared Package Changes

1. Edit files in `packages/shared/src/`
2. Rebuild the package:
   ```bash
   npm run build --workspace=packages/shared
   ```
3. Restart backend/frontend to pick up changes

### Database Changes

1. Edit `apps/backend/prisma/schema.prisma`
2. Generate and apply migration:
   ```bash
   cd apps/backend
   npx prisma migrate dev --name describe_your_change
   cd ../..
   ```
3. Regenerate Prisma client:
   ```bash
   cd apps/backend && npx prisma generate && cd ../..
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user + family |
| POST | `/api/v1/auth/login` | Login, returns tokens |
| POST | `/api/v1/auth/logout` | Logout, revoke refresh token |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user profile |

### Resources (all require authentication)
| Resource | Endpoints |
|----------|-----------|
| Accounts | `GET/POST /accounts`, `GET/PUT/DELETE /accounts/:id` |
| Categories | `GET/POST /categories`, `GET/PUT/DELETE /categories/:id` |
| Transactions | `GET/POST /transactions`, `GET/PUT/DELETE /transactions/:id` |
| Budgets | `GET/POST /budgets`, `GET/PUT/DELETE /budgets/:id` |
| Reports | `GET /reports/monthly-summary`, `/category-breakdown`, `/trend` |
| Dashboard | `GET /dashboard` |
| Import | `POST /import/upload`, `/preview`, `/commit`, `GET /import/history` |

### API Response Format

All responses follow this structure:
```json
{
  "data": { ... },
  "error": null
}
```

Or on error:
```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Available Scripts

### Root Level

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint on all packages |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript type checking |
| `npm run seed:demo` | Load demo data |

### Backend (`--workspace=apps/backend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run prisma:migrate` | Run migrations |
| `npm run prisma:generate` | Generate Prisma client |

### Web (`--workspace=apps/web`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Shared (`--workspace=packages/shared`)

| Command | Description |
|---------|-------------|
| `npm run build` | Build the package |

## Using Demo Data

After running `npm run seed:demo`, use these credentials:

| Email | Password | Role |
|-------|----------|------|
| john@demo.mybudget.app | Demo123! | Family Admin |
| jane@demo.mybudget.app | Demo123! | Member |
| tom@demo.mybudget.app | Demo123! | Member |
| emma@demo.mybudget.app | Demo123! | Viewer |

See [Demo Data](../demo/README.md) for full details.

## Debugging

### Backend Logs

Watch the terminal running the backend for request logs and errors.

### Frontend Debugging

1. Open browser DevTools (F12)
2. Check Console for errors
3. Network tab shows API requests

### Database Inspection

```bash
# Connect to database
docker exec -it mybudget-db psql -U user -d mybudgetdb

# Common queries
\dt                          -- List tables
SELECT * FROM users;         -- View users
SELECT * FROM transactions LIMIT 10;
\q                           -- Quit
```

Or use Prisma Studio:
```bash
cd apps/backend && npx prisma studio
```
Opens a web UI at http://localhost:5555

## Code Quality

Before committing:

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

## Next Steps

- [Testing Guide](TESTING.md) - Running automated tests
- [Setup Guide](SETUP.md) - Initial setup reference
- [Demo Data](../demo/README.md) - Demo account details
