#!/usr/bin/env bash
# Installs everything LeRobot needs for an SO-101 arm: system prerequisites (reported,
# not auto-installed — they usually need sudo), the Python venv, and the feetech motor
# extra. Mirrors lerobot/AGENT_GUIDE.md §4.1. Safe to re-run.
set -uo pipefail

REPO="${1:?usage: install_lerobot.sh <lerobot-repo-path>}"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m  ok:\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m  missing:\033[0m %s\n' "$1"; }

if [ ! -d "$REPO/.git" ]; then
  step "Cloning LeRobot (first run only)"
  if ! command -v git >/dev/null 2>&1; then
    printf '\n\033[1;31mgit is required to clone LeRobot — install it first (e.g. "sudo apt install git").\033[0m\n'
    exit 1
  fi
  git clone https://github.com/huggingface/lerobot.git "$REPO" || exit 1
fi
cd "$REPO" || exit 1

step "Checking system prerequisites"
if command -v git >/dev/null 2>&1; then ok "git found"; else
  printf '\n\033[1;31mgit not found — install it first.\033[0m\n'; exit 1
fi
if command -v ffmpeg >/dev/null 2>&1; then ok "ffmpeg found ($(ffmpeg -version | head -1))"; else
  warn "ffmpeg not found — optional, only needed later for recording camera datasets, not for calibration/teleoperation. Skipping."
fi
if command -v git-lfs >/dev/null 2>&1; then ok "git-lfs found"; else
  warn "git-lfs not found — optional, only needed later for recording/sharing datasets, not for calibration/teleoperation. Skipping."
fi

step "Setting up the Python environment"
if command -v uv >/dev/null 2>&1; then
  ok "uv found, using it (recommended path)"
  uv sync --locked --extra feetech
  UV_STATUS=$?
else
  warn "uv not found — falling back to python -m venv + pip (slower, still works)"
  if [ ! -d .venv ]; then
    python3 -m venv .venv
  fi
  ./.venv/bin/pip install --upgrade pip
  ./.venv/bin/pip install -e ".[feetech]"
  UV_STATUS=$?
fi

if [ "$UV_STATUS" -ne 0 ]; then
  printf '\n\033[1;31mInstall step failed (see errors above).\033[0m\n'
  exit "$UV_STATUS"
fi

step "Verifying the install"
./.venv/bin/python -c "import serial; import scservo_sdk; print('pyserial + feetech SDK import OK')"
VERIFY_STATUS=$?

# Deliberately not running `git lfs pull` here — it downloads LeRobot's full test-fixture
# dataset (used only by its own test suite), which can be a large, unnecessary download for
# someone who just wants to calibrate/teleoperate. Only fetch LFS assets if/when a future
# dataset-recording block actually needs them.

if [ "$VERIFY_STATUS" -eq 0 ]; then
  printf '\n\033[1;32mLeRobot is installed and ready.\033[0m\n'
else
  printf '\n\033[1;31mPython packages installed but failed to import — check the errors above.\033[0m\n'
  exit "$VERIFY_STATUS"
fi
