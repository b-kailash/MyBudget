#!/bin/bash

# This script runs all backend API tests.
# It should be executed from within the 'tests' directory.

# --- Configuration ---
LOG_DIR="logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="${LOG_DIR}/test_run_${TIMESTAMP}.log"

# --- Functions ---

# Function to print messages to both console and log file
log() {
  echo "$1" | tee -a "$LOG_FILE"
}

# --- Pre-run Checks ---
log "================================================="
log "MyBudget Backend Test Suite Runner"
log "Start time: $(date)"
log "================================================="
log ""

# Check if node_modules exists, if not, run npm install
if [ ! -d "node_modules" ]; then
  log "[INFO] 'node_modules' directory not found. Running 'npm install'..."
  npm install | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    log "[ERROR] npm install failed. Aborting."
    exit 1
  fi
  log "[INFO] Dependencies installed successfully."
  log ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  log "[ERROR] The '.env' file is missing."
  log "[ERROR] Please create a '.env' file in the 'tests' directory with the BASE_URL of your API."
  log "[ERROR] Example: BASE_URL=http://localhost:3000"
  log "[ERROR] Aborting."
  exit 1
fi

log "[INFO] Environment check complete. Starting tests..."
log ""

# --- Run Tests ---

# The command `npx jest` will automatically find and run all *.test.ts files.
# We pipe the output to our log file and also display it on the console.
npx jest --verbose --detectOpenHandles --forceExit | tee -a "$LOG_FILE"

# Capture jest exit code
JEST_EXIT_CODE=${PIPESTATUS[0]}

# --- Post-run Summary ---
log ""
log "================================================="
log "Test run finished at: $(date)"

if [ $JEST_EXIT_CODE -eq 0 ]; then
  log "Result: SUCCESS"
else
  log "Result: FAILED"
  log "One or more tests failed. Please review the log for details."
fi

log "Full log file available at: ${LOG_FILE}"
log "================================================="

# Return the exit code from Jest
exit $JEST_EXIT_CODE
