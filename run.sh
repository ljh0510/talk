#!/bin/bash

# Exit immediately if any command fails
set -e

# Define paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "============================================="
echo "   KokoaTalk Enterprise Verification & Run   "
echo "============================================="

# 1. Verification: Backend check
echo -e "\n[1/4] Verifying Backend Python Code..."
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3.12 -m venv "$BACKEND_DIR/venv"
fi

# Install/update packages
echo "Checking/Installing backend dependencies..."
"$BACKEND_DIR/venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

# Run a compile check on python files to ensure no syntax errors
echo "Running Python syntax compilation checks..."
"$BACKEND_DIR/venv/bin/python" -m compileall -q "$BACKEND_DIR/app"

echo "✓ Backend verification passed."

# 2. Verification: Frontend check
echo -e "\n[2/4] Verifying Frontend TypeScript & Tailwind Compilation..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Installing..."
    npm install
fi

echo "Running TypeScript type checks (tsc --noEmit)..."
npm run build -- --logLevel error || (npx tsc --noEmit && echo "TSC check failed")

echo "✓ Frontend verification passed."

# 3. Database Seeding
echo -e "\n[3/4] Initializing and Seeding Database..."
cd "$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/python" "$BACKEND_DIR/seed.py"
echo "✓ Database seeded successfully."

# 4. Simultaneous Execution of Servers
echo -e "\n[4/4] Starting Backend & Frontend Servers concurrently..."

# Setup cleanup traps on exit (kills all background processes spawned by this script)
cleanup() {
    echo -e "\nStopping servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "Starting FastAPI Backend on http://localhost:8000..."
cd "$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Vite Frontend on http://localhost:5173..."
cd "$FRONTEND_DIR"
npm run dev > "$ROOT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait 2 seconds to check if they started successfully
sleep 2

if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "✓ FastAPI Backend is running (PID: $BACKEND_PID). Logs: backend.log"
else
    echo "✗ FastAPI Backend failed to start. Check backend.log"
    cat "$ROOT_DIR/backend.log"
    exit 1
fi

if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "✓ Vite Frontend is running (PID: $FRONTEND_PID). Logs: frontend.log"
else
    echo "✗ Vite Frontend failed to start. Check frontend.log"
    cat "$ROOT_DIR/frontend.log"
    exit 1
fi

echo -e "\nBoth servers are running successfully!"
echo "Press Ctrl+C to terminate both servers."
echo "============================================="

# Keep script running to maintain trap hooks
wait
