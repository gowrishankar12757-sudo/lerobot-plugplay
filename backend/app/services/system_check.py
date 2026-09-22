"""Prerequisite checks shown by the Install block before/after it runs."""

from __future__ import annotations

import shutil
import subprocess

from app.config import LEROBOT_PYTHON, LEROBOT_REPO, LEROBOT_VENV_BIN


def _check(id_: str, label: str, ok: bool, fix: str | None = None) -> dict:
    return {"id": id_, "label": label, "ok": ok, "fix": fix}


def run_checks() -> list[dict]:
    checks = []

    checks.append(
        _check("repo", f"LeRobot repo found at {LEROBOT_REPO}", LEROBOT_REPO.is_dir(), "Run the Install block — it clones LeRobot automatically")
    )
    checks.append(
        _check(
            "venv",
            "Python virtual environment (.venv) exists",
            LEROBOT_PYTHON.exists(),
            "Run the Install block",
        )
    )

    git_ok = shutil.which("git") is not None
    checks.append(_check("git", "git installed", git_ok, "Install git (e.g. 'sudo apt install git')"))

    ffmpeg_ok = shutil.which("ffmpeg") is not None
    checks.append(_check("ffmpeg", "ffmpeg installed (needed to record video datasets)", ffmpeg_ok, "sudo apt install ffmpeg"))

    lfs_ok = shutil.which("git-lfs") is not None
    checks.append(_check("git-lfs", "git-lfs installed", lfs_ok, "sudo apt install git-lfs"))

    hardware_ok = False
    if LEROBOT_PYTHON.exists():
        try:
            result = subprocess.run(
                [str(LEROBOT_PYTHON), "-c", "import serial, scservo_sdk"],
                capture_output=True,
                timeout=15,
            )
            hardware_ok = result.returncode == 0
        except (OSError, subprocess.TimeoutExpired):
            hardware_ok = False
    checks.append(
        _check(
            "hardware-extra",
            "pyserial + Feetech motor SDK importable (lerobot[feetech] installed)",
            hardware_ok,
            "Run the Install block",
        )
    )

    scripts_ok = (LEROBOT_VENV_BIN / "lerobot-calibrate").exists() or (LEROBOT_VENV_BIN / "lerobot-teleoperate").exists()
    checks.append(
        _check("cli", "lerobot-calibrate / lerobot-teleoperate CLI available", scripts_ok, "Run the Install block")
    )

    return checks


def is_ready(checks: list[dict] | None = None) -> bool:
    checks = checks if checks is not None else run_checks()
    required = {"repo", "venv", "hardware-extra", "cli"}
    return all(c["ok"] for c in checks if c["id"] in required)
