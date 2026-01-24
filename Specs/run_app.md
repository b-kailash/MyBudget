# How to Run the MyBudget Application (Backend)

This document provides instructions on how to set up and run the backend of the MyBudget application. As per the `todo.md` file, the backend API (Phases 1B-1E) is complete, but no frontend code has been written yet. Therefore, you can run the backend server and the database, but there is no user interface to interact with it directly. You would need to use an API client (like Postman, Insomnia, or `curl`) to interact with the API endpoints.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Docker** and **Docker Compose**: Required to run the PostgreSQL database.
*   **Node.js** (LTS version recommended) and **npm**: Required to run the backend server and manage project dependencies.

## Step-by-Step Guide

Follow these steps from the project's root directory (`/home/bkailash/MyBudget`).

### 1. Install Project Dependencies

First, install all the `npm` packages required for the monorepo. This command should be run from the root of the project.

```bash
npm install
```

### 2. Set Up Environment Variables for the Backend

The backend application relies on environment variables for configuration, including the database connection string and JWT secrets.

1.  Navigate to the backend application directory:
    ```bash
    cd apps/backend
    ```
2.  Copy the example environment file to create your local `.env` file:
    ```bash
    cp .env.example .env
    ```
3.  Open the newly created `.env` file (`apps/backend/.env`) in your preferred text editor.
    *   **`DATABASE_URL`**: Ensure this is correctly pointing to your PostgreSQL instance. The default value in `.env.example` should work with the `docker-compose.dev.yml` setup.
        Example: `DATABASE_URL="postgresql://user:password@localhost:5432/mybudgetdb?schema=public"`
    *   **`JWT_SECRET`**: **IMPORTANT:** Replace the placeholder value with a strong, random string. This is crucial for the security of your JSON Web Tokens.
        Example: `JWT_SECRET="your_very_secret_and_long_jwt_secret_here"`
    *   **`REFRESH_TOKEN_SECRET`**: Similar to `JWT_SECRET`, provide another strong, random string for refresh token handling.
    *   Review other variables and adjust as necessary.
4.  Navigate back to the project root:
    ```bash
    cd ../..
    ```

### 3. Start the PostgreSQL Database

The `docker-compose.dev.yml` file defines and configures the PostgreSQL database service. Run this command from the project root to start the database in the background.

```bash
docker-compose -f docker-compose.dev.yml up -d
```

You can verify that the database container is running using `docker ps`.

### 4. Run Database Migrations

With the PostgreSQL database running, you need to apply the Prisma migrations to create the necessary tables and schema. This command will synchronize your database with the `prisma/schema.prisma` definition.

```bash
npm run prisma:migrate:dev --workspace=apps/backend
```

*   **Note**: The `todo.md` provided `cd apps/backend && npx prisma migrate dev --name initial_schema`. For consistency and ease of use in a monorepo, it is recommended to add a script to `apps/backend/package.json` like `"prisma:migrate:dev": "npx prisma migrate dev --name initial_schema"` and then use `npm run prisma:migrate:dev --workspace=apps/backend` from the root. I will assume this script exists or you can adapt the command as shown in `todo.md`.

### 5. Start the Backend Server

Finally, start the Node.js backend API server. This command will run the backend in development mode, typically with live-reloading.

```bash
npm run dev --workspace=apps/backend
```

The backend server should now be running, typically accessible at `http://localhost:3000` (check the output in your terminal for the exact port). You can now use an API client to interact with the endpoints defined in `Specs.md` and implemented in Phases 1D and 1E.

## 6. Running the Automated Tests

A comprehensive test suite is located in the `/tests` directory. For detailed instructions on how to set up the test environment and run the tests, please refer to the **[Backend Testing Guide](TESTING_GUIDE.md)**.

To run the tests, you will typically execute the following commands from the project root:
```bash
cd tests
./run_all_tests.sh
```
Make sure you have configured the `.env` file in the `tests` directory as described in the testing guide.