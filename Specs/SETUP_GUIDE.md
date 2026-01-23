# MyBudget Application Setup and Run Guide (Backend)

This guide provides detailed instructions to clone the MyBudget repository, install its dependencies, set up the database, and start the backend server.

**Note:** As of the current development phase, only the backend API is functional. The web and mobile frontends are not yet implemented and will require separate setup once they are developed.

## Prerequisites

Before you begin, ensure your system meets the following requirements:

*   **Git**: For cloning the repository.
    *   [Download Git](https://git-scm.com/downloads)
    *   Verify installation: `git --version`
*   **Node.js & npm**: Version 18.0.0 or higher is required. It is recommended to use the latest LTS version.
    *   [Download Node.js (includes npm)](https://nodejs.org/en/download/)
    *   Verify installation: `node --version` and `npm --version`
*   **Docker & Docker Compose**: For running the PostgreSQL database.
    *   [Download Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Compose)
    *   Verify installation: `docker --version` and `docker-compose --version`

## Quick Setup with `setup.sh` (Recommended)

For a streamlined setup, you can use the provided `setup.sh` script. This script will automate dependency installation, environment file creation, shared package build, database startup, and migration.

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone https://github.com/b-kailash/MyBudget.git
    cd MyBudget
    ```
2.  **Run the Setup Script:**
    ```bash
    chmod +x setup.sh  # Make the script executable (if needed)
    ./setup.sh
    ```
    The script will guide you through updating the necessary secrets in the `apps/backend/.env` file. Once the script completes, follow the instructions it provides to start the backend server.

---

## Manual Setup Steps

If you prefer to set up the application manually, follow these detailed steps.

### 1. Clone the Repository

Open your terminal or command prompt and clone the repository using Git:

```bash
git clone https://github.com/b-kailash/MyBudget.git
cd MyBudget
```

### 2. Install Dependencies

The project is set up as a monorepo. Navigate to the root of the cloned repository and install all project dependencies:

```bash
npm install
```

This command will install dependencies for all packages and applications within the monorepo, including `@mybudget/backend` and `@mybudget/shared`.

### 3. Build the Shared Package

**Important:** The backend depends on the shared package (`@mybudget/shared`), which must be compiled before the backend can run.

Run this command from the project's root directory:

```bash
npm run build --workspace=packages/shared
```

This compiles the TypeScript code in the shared package and outputs the JavaScript files to `packages/shared/dist/`.

**Note:** If you make changes to the shared package, you need to rebuild it before running the backend again.

### 4. Set Up Backend Environment Variables

The backend requires specific environment variables for configuration, such as database connection details and JWT secrets.

1.  Navigate to the backend application directory:
    ```bash
    cd apps/backend
    ```
2.  Create a `.env` file by copying the provided example:
    ```bash
    cp .env.example .env
    ```
3.  Open the newly created `.env` file (`apps/backend/.env`) in your text editor and configure the following:

    | Variable | Description | Example |
    |----------|-------------|---------|
    | `DATABASE_URL` | PostgreSQL connection string. The default works with Docker Compose setup. | `postgresql://user:password@localhost:5432/mybudgetdb?schema=public` |
    | `JWT_SECRET` | **CRITICAL.** A strong, random string for signing JWT access tokens. | `your_highly_secure_random_string_here_min_32_chars` |
    | `REFRESH_TOKEN_SECRET` | **CRITICAL.** Another strong, random string for signing refresh tokens. | `another_super_secret_string_different_from_jwt` |
    | `PORT` | (Optional) The port the server runs on. Defaults to `3000`. | `3000` |

    **Security Note:** Use a password generator to create strong secrets. Each secret should be at least 32 characters long and contain a mix of letters, numbers, and symbols.

4.  Navigate back to the project root directory:
    ```bash
    cd ../..
    ```

### 5. Start the PostgreSQL Database

The project uses a Docker Compose file (`docker-compose.dev.yml`) to quickly spin up a PostgreSQL database instance for development.

1.  **Start the database container:**
    ```bash
    docker-compose -f docker-compose.dev.yml up -d
    ```

2.  **Verify the container is running:**
    ```bash
    docker ps
    ```
    You should see a container with a PostgreSQL image running.

3.  **Wait for the database to be ready:**
    The database needs a few seconds to initialize. You can check the logs:
    ```bash
    docker-compose -f docker-compose.dev.yml logs -f
    ```
    Press `Ctrl+C` to exit the logs once you see the database is ready.

### 6. Run Database Migrations

Once the PostgreSQL database container is running, you need to apply the database schema using Prisma migrations. This will create all the necessary tables and relationships in your database.

Run this command from the project's root directory:

```bash
npm run prisma:migrate --workspace=apps/backend
```

If this is the first time running migrations, you may be prompted for a migration name. You can use `initial_schema` or press Enter to accept the default.

**Troubleshooting:**
- If the migration fails with a connection error, ensure the Docker container is running and the `DATABASE_URL` in `.env` is correct.
- If you need to reset the database completely, run:
  ```bash
  npm run prisma:migrate:reset --workspace=apps/backend
  ```

### 7. Generate Prisma Client (if needed)

The Prisma client should be generated automatically during migration. If you encounter errors about missing Prisma client, run:

```bash
npm run prisma:generate --workspace=apps/backend
```

### 8. Start the Backend Server

Finally, you can start the Node.js backend API server. This command runs the backend in development mode with file watching and automatic restarts.

Run this command from the project's root directory:

```bash
npm run dev --workspace=apps/backend
```

You should see output similar to:
```
Server is running on port 3000
```

### 9. Verify the Backend Server

The backend server should now be running at `http://localhost:3000`.

**Test the health endpoint:**
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{"status":"ok","timestamp":"..."}
```

**Available API Endpoints:**
- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

You can use an API client like Postman, Insomnia, or `curl` to interact with the API.

---

## Running Tests

To run the backend unit tests:

```bash
npm run test --workspace=apps/backend
```

---

## Common Issues and Solutions

### Error: Cannot find module '@mybudget/shared/dist/index.mjs'

**Cause:** The shared package has not been built.

**Solution:** Build the shared package:
```bash
npm run build --workspace=packages/shared
```

### Error: Connection refused to database

**Cause:** The PostgreSQL Docker container is not running.

**Solution:**
1. Check if Docker is running
2. Start the database: `docker-compose -f docker-compose.dev.yml up -d`
3. Verify with `docker ps`

### Error: Prisma migration failed

**Cause:** Database schema conflicts or connection issues.

**Solutions:**
- Ensure the database container is running
- Check `DATABASE_URL` in `.env` matches the Docker Compose configuration
- For fresh setup, reset the database: `npm run prisma:migrate:reset --workspace=apps/backend`

### Error: Port 3000 already in use

**Cause:** Another process is using port 3000.

**Solutions:**
- Find and kill the process: `lsof -i :3000` then `kill <PID>`
- Or change the `PORT` in `apps/backend/.env` to a different port

---

## Stopping the Application

1. **Stop the backend server:** Press `Ctrl+C` in the terminal where it's running.

2. **Stop the database container:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

   To also remove the database data (full reset):
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   ```

---

## Summary of Commands

| Step | Command |
|------|---------|
| Clone repository | `git clone https://github.com/b-kailash/MyBudget.git && cd MyBudget` |
| Install dependencies | `npm install` |
| Build shared package | `npm run build --workspace=packages/shared` |
| Create .env file | `cp apps/backend/.env.example apps/backend/.env` |
| Start database | `docker-compose -f docker-compose.dev.yml up -d` |
| Run migrations | `npm run prisma:migrate --workspace=apps/backend` |
| Start backend | `npm run dev --workspace=apps/backend` |
| Run tests | `npm run test --workspace=apps/backend` |
| Stop database | `docker-compose -f docker-compose.dev.yml down` |

---

That's it! The MyBudget backend is now running.
