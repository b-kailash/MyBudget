# MyBudget

A full-stack family budgeting application with web and mobile frontends.

## Project Structure

```
/apps
  /web          # React web SPA
  /mobile       # React Native app (Expo)
  /backend      # Node.js + Express API
/packages
  /shared       # Shared TypeScript types, validation, API client, utilities
```

## Tech Stack

- **Backend:** Node.js + Express + PostgreSQL + Prisma
- **Web Frontend:** React + TypeScript + React Router + React Query
- **Mobile Frontend:** React Native (Expo) + TypeScript
- **Shared:** TypeScript types, Zod validation, API client

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 15+ (or Docker)
- Docker & Docker Compose (for containerized development)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and configure your database:

```bash
cp apps/backend/.env.example apps/backend/.env
```

### 3. Start Development

```bash
# Start the backend
npm run dev --workspace=apps/backend

# Start the web frontend
npm run dev --workspace=apps/web
```

## Available Scripts

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `npm run lint`         | Run ESLint across all packages  |
| `npm run lint:fix`     | Fix ESLint errors automatically |
| `npm run format`       | Format code with Prettier       |
| `npm run format:check` | Check code formatting           |
| `npm run typecheck`    | Run TypeScript type checking    |
| `npm run clean`        | Remove all node_modules         |

## Development

This is a monorepo using npm workspaces. Each app/package can be run independently:

```bash
# Run a script in a specific workspace
npm run <script> --workspace=apps/backend
npm run <script> --workspace=apps/web
npm run <script> --workspace=packages/shared
```

## License

Private - All rights reserved.
