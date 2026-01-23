#!/bin/bash

# setup.sh - Automates the setup process for the MyBudget backend application.

echo "🚀 Starting MyBudget Backend Setup..."

# --- 1. Check for Prerequisites ---
echo "⚙️ Checking for prerequisites (npm, docker)..."
command -v npm >/dev/null 2>&1 || { echo >&2 "npm is not installed. Please install Node.js and npm."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo >&2 "Docker is not installed. Please install Docker Desktop."; exit 1; }

# Detect Docker Compose command (v2: "docker compose" vs v1: "docker-compose")
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ Prerequisites met (using Docker Compose v2)."
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
    echo "✅ Prerequisites met (using Docker Compose v1)."
else
    echo >&2 "Docker Compose is not installed. Please install Docker Desktop."
    exit 1
fi

# --- 2. Install Node.js Dependencies ---
echo "📦 Installing Node.js dependencies (this may take a moment)..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed. Please check the output above for errors."
    exit 1
fi
echo "✅ Node.js dependencies installed."

# --- 3. Build Shared Package ---
echo "🔨 Building shared package (@mybudget/shared)..."
npm run build --workspace=packages/shared
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package. Please check the output above for errors."
    exit 1
fi
echo "✅ Shared package built successfully."

# --- 4. Set Up Environment Variables ---
echo "📝 Setting up backend environment variables..."
BACKEND_DIR="apps/backend"
ENV_FILE="$BACKEND_DIR/.env"
ENV_EXAMPLE_FILE="$BACKEND_DIR/.env.example"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory ($BACKEND_DIR) not found. Are you running this script from the project root?"
    exit 1
fi

if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
    echo "❌ .env.example not found in $BACKEND_DIR. Please ensure the file exists."
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Copying $ENV_EXAMPLE_FILE to $ENV_FILE..."
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    echo "Please open '$ENV_FILE' and update 'JWT_SECRET' and 'REFRESH_TOKEN_SECRET' with strong, random values. Press Enter to continue once updated."
    read -r
else
    echo ".env file already exists at $ENV_FILE. Please ensure 'JWT_SECRET' and 'REFRESH_TOKEN_SECRET' are set."
    echo "Press Enter to continue..."
    read -r
fi
echo "✅ Environment variables set (please confirm you've updated secrets in .env)."

# --- 5. Start PostgreSQL Database ---
echo "🐳 Starting PostgreSQL database via Docker Compose..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up -d
if [ $? -ne 0 ]; then
    echo "❌ Docker Compose failed to start the database. Please check your Docker installation and permissions."
    exit 1
fi
echo "Waiting a few seconds for the database to become ready..."
sleep 5 # Give the database a moment to fully start
echo "✅ PostgreSQL database is running."

# --- 6. Run Database Migrations ---
echo "📊 Running Prisma database migrations..."
npm run prisma:migrate --workspace=apps/backend
if [ $? -ne 0 ]; then
    echo "❌ Prisma migrations failed. Please check the database connection and migration history."
    echo "You might need to resolve conflicts or run 'npm run prisma:migrate:dev --workspace=apps/backend' if it's a fresh setup."
    exit 1
fi
echo "✅ Database migrations applied."

echo "🎉 MyBudget Backend Setup Complete!"
echo "To start the backend server, run: npm run dev --workspace=apps/backend"
echo "You can access the API, usually at http://localhost:3000"
