#!/usr/bin/env bash
# Starts the LeRobot Plug & Play backend + frontend together.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d backend/.venv ]; then
  echo "Setting up backend/.venv (first run only)..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -q --upgrade pip
  backend/.venv/bin/pip install -q -r backend/requirements.txt
fi

if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend dependencies (first run only)..."
  (cd frontend && npm install)
fi

cleanup() {
  echo "Stopping..."
  kill "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd backend && exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8420) &
BACKEND_PID=$!

(cd frontend && exec npm run dev -- --port 5173) &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://127.0.0.1:8420"
echo "  Frontend: http://127.0.0.1:5173   <-- open this in your browser"
echo ""

wait
