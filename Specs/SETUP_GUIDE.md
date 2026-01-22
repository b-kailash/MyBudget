# MyBudget Application Setup and Run Guide (Backend)

This guide provides detailed instructions to clone the MyBudget repository, install its dependencies, set up the database, and start the backend server.

**Note:** As of the current development phase, only the backend API is functional. The web and mobile frontends are not yet implemented and will require separate setup once they are developed.

## Prerequisites

Before you begin, ensure your system meets the following requirements:

*   **Git**: For cloning the repository.
    *   [Download Git](https://git-scm.com/downloads)
*   **Node.js & npm**: For running the backend application and managing packages. It is recommended to use the latest LTS version.
    *   [Download Node.js (includes npm)](https://nodejs.org/en/download/)
*   **Docker & Docker Compose**: For running the PostgreSQL database.
    *   [Download Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Compose)

## Quick Setup with `setup.sh` (Recommended)

For a streamlined setup, you can use the provided `setup.sh` script. This script will automate dependency installation, environment file creation, database startup, and migration.

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone https://github.com/b-kailash/MyBudget.git
    cd MyBudget
    ```
2.  **Run the Setup Script:**
    ```bash
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

This command will install dependencies for all packages and applications within the monorepo, including `@mybudget/backend`.

### 3. Set Up Backend Environment Variables

The backend requires specific environment variables for configuration, such as database connection details and JWT secrets.

1.  Navigate to the backend application directory:
    ```bash
    cd apps/backend
    ```
2.  Create a `.env` file by copying the provided example:
    ```bash
    cp .env.example .env
    ```
3.  Open the newly created `.env` file (`apps/backend/.env`) in your text editor.
    *   **`DATABASE_URL`**: This should point to your PostgreSQL instance. The default value in `.env.example` is configured to work with the Docker Compose setup.
        Example: `DATABASE_URL="postgresql://user:password@localhost:5432/mybudgetdb?schema=public"`
    *   **`JWT_SECRET`**: **CRITICAL FOR SECURITY.** Replace the placeholder value with a strong, long, and randomly generated string. This is used for signing JWT access tokens.
        Example: `JWT_SECRET="your_highly_secure_and_random_jwt_access_token_secret_here"`
    *   **`REFRESH_TOKEN_SECRET`**: Similarly, provide another strong, random string for signing refresh tokens.
        Example: `REFRESH_TOKEN_SECRET="another_super_secret_refresh_token_string"`
    *   Review any other variables and adjust them if necessary for your local environment.
4.  Navigate back to the project root directory:
    ```bash
    cd ../..
    ```

### 4. Start the PostgreSQL Database

The project uses a Docker Compose file (`docker-compose.dev.yml`) to quickly spin up a PostgreSQL database instance for development.

Run the following command from the project's root directory to start the database in the background:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

You can verify that the database container is running by using `docker ps`.

### 5. Run Database Migrations

Once the PostgreSQL database container is running, you need to apply the database schema using Prisma migrations. This will create all the necessary tables and relationships in your database.

Run this command from the project's root directory:

```bash
npm run prisma:migrate --workspace=apps/backend
```

If prompted for a migration name, you can use `initial_schema` or similar. If this is the first migration, it will create the entire schema.

### 6. Start the Backend Server

Finally, you can start the Node.js backend API server. This command runs the backend in development mode, typically with file watching and automatic restarts.

Run this command from the project's root directory:

```bash
npm run dev --workspace=apps/backend
```

### 7. Verify the Backend Server

The backend server should now be running. You will typically see output in your terminal indicating that the server is listening, usually on `http://localhost:3000`.

You can now use an API client (like Postman, Insomnia, or a simple `curl` command) to interact with the API endpoints (e.g., `/api/v1/auth/register`, `/api/v1/health`).

---

That's it! The MyBudget backend is now running.
