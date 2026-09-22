#!/usr/bin/env bash
# Starts the LeRobot Plug & Play backend + frontend together.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# A non-interactive shell (which running a script always is) doesn't source ~/.bashrc,
# so a locally-installed Node.js may be missing from PATH even though it's on disk.
# Pick up common install locations here so this works regardless of how it's launched.
for node_dir in "$HOME/.local/node/bin" "$HOME/.nvm/current/bin" "$HOME/.local/bin" /usr/local/bin; do
  [ -d "$node_dir" ] && PATH="$node_dir:$PATH"
done
export PATH

missing=0
command -v python3 >/dev/null 2>&1 || { echo "python3 not found — install Python 3.10+ first." >&2; missing=1; }
command -v node >/dev/null 2>&1 || { echo "node not found — install Node.js 18+ from https://nodejs.org/ first." >&2; missing=1; }
command -v npm >/dev/null 2>&1 || { echo "npm not found — it ships with Node.js, install Node.js 18+ from https://nodejs.org/ first." >&2; missing=1; }
[ "$missing" -eq 0 ] || exit 1

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
