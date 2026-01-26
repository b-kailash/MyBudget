# MyBudget Setup Guide

Complete setup instructions for the MyBudget application.

## Prerequisites

| Software | Required Version | Verify Command |
|----------|------------------|----------------|
| Node.js | >= 18.0.0 | `node --version` |
| npm | >= 9.0.0 | `npm --version` |
| Docker | Latest | `docker --version` |
| Docker Compose | v2 recommended | `docker compose version` |
| Git | Latest | `git --version` |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/b-kailash/MyBudget.git
cd MyBudget

# 2. Install dependencies
npm install

# 3. Set up environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your secrets (see Environment Variables below)

# 4. Build the shared package
npm run build --workspace=packages/shared

# 5. Start the database
docker compose -f docker-compose.dev.yml up -d

# 6. Run database migrations
cd apps/backend && npx prisma migrate dev && cd ../..

# 7. (Optional) Seed demo data
npm run seed:demo

# 8. Start the application
npm run dev --workspace=apps/backend   # Terminal 1: Backend on port 3000
npm run dev --workspace=apps/web       # Terminal 2: Frontend on port 5173
```

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/b-kailash/MyBudget.git
cd MyBudget
```

### Step 2: Install Dependencies

The project uses npm workspaces. Install all dependencies from the root:

```bash
npm install
```

This installs dependencies for:
- `apps/backend` - Node.js API server
- `apps/web` - React web application
- `packages/shared` - Shared TypeScript types and utilities

### Step 3: Build Shared Package

The backend and web apps depend on the shared package:

```bash
npm run build --workspace=packages/shared
```

**Note:** Rebuild this whenever you modify `packages/shared`.

### Step 4: Configure Environment Variables

Create the backend environment file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/mybudgetdb` |
| `JWT_SECRET` | Access token signing key (min 32 chars) | Generate with `openssl rand -base64 32` |
| `REFRESH_TOKEN_SECRET` | Refresh token signing key (min 32 chars) | Generate with `openssl rand -base64 32` |
| `PORT` | API server port (optional) | `3000` |

**Security:** Use strong, unique secrets. Never commit `.env` files.

### Step 5: Start PostgreSQL Database

```bash
# Start the database container
docker compose -f docker-compose.dev.yml up -d

# Verify it's running
docker ps

# View logs (optional)
docker compose -f docker-compose.dev.yml logs -f
```

The database runs on `localhost:5432` with credentials defined in `docker-compose.dev.yml`.

### Step 6: Run Database Migrations

Apply the Prisma schema to create database tables:

```bash
cd apps/backend
npx prisma migrate dev
cd ../..
```

If prompted for a migration name, use `init` or press Enter.

### Step 7: Seed Demo Data (Optional)

Load sample data for testing:

```bash
npm run seed:demo
```

This creates:
- A demo family with 4 users
- 3 bank accounts
- 300+ realistic transactions
- Categories and budgets

See [Demo Data](../demo/README.md) for login credentials.

### Step 8: Start the Application

**Backend (API Server):**
```bash
npm run dev --workspace=apps/backend
```
Runs on: `http://localhost:3000`

**Frontend (Web App):**
```bash
npm run dev --workspace=apps/web
```
Runs on: `http://localhost:5173`

## Verify Installation

**Test Backend Health:**
```bash
curl http://localhost:3000/api/v1/health
```
Expected: `{"status":"ok","timestamp":"..."}`

**Test Frontend:**
Open `http://localhost:5173` in your browser.

## Common Issues

### "Cannot find module '@mybudget/shared'"

**Solution:** Build the shared package:
```bash
npm run build --workspace=packages/shared
```

### "Connection refused" to database

**Solution:**
1. Ensure Docker is running
2. Start the database: `docker compose -f docker-compose.dev.yml up -d`
3. Wait a few seconds for PostgreSQL to initialize

### Port already in use

**Solution:** Kill the process using the port:
```bash
# Find process
lsof -i :3000

# Kill it
kill <PID>
```

Or change the port in `.env`.

### Prisma migration failed

**Solution:** Reset the database:
```bash
cd apps/backend
npx prisma migrate reset
cd ../..
```

**Warning:** This deletes all data.

## Stopping the Application

```bash
# Stop backend/frontend: Ctrl+C in their terminal windows

# Stop database
docker compose -f docker-compose.dev.yml down

# Stop and remove data volumes
docker compose -f docker-compose.dev.yml down -v
```

## Next Steps

- [Development Guide](DEVELOPMENT.md) - Running and developing the application
- [Testing Guide](TESTING.md) - Running automated tests
- [Demo Data](../demo/README.md) - Using demo accounts
