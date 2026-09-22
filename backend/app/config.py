"""Locates the LeRobot checkout + venv this app drives, and its calibration dir."""

import os
from pathlib import Path


def _first_existing(paths: list[Path]) -> Path | None:
    for p in paths:
        if p.exists():
            return p
    return None


LEROBOT_REPO = Path(
    os.environ.get("LEROBOT_REPO_PATH")
    or _first_existing(
        [
            Path.home() / "lerobot",
            Path(__file__).resolve().parents[3] / "lerobot",
        ]
    )
    or (Path.home() / "lerobot")
).expanduser()

LEROBOT_VENV = Path(os.environ.get("LEROBOT_VENV_PATH") or (LEROBOT_REPO / ".venv")).expanduser()
LEROBOT_VENV_BIN = LEROBOT_VENV / "bin"
LEROBOT_PYTHON = LEROBOT_VENV_BIN / "python"

# Same default LeRobot itself uses (see src/lerobot/utils/constants.py), overridable the same way.
HF_LEROBOT_CALIBRATION = Path(
    os.environ.get("HF_LEROBOT_CALIBRATION") or (Path.home() / ".cache" / "huggingface" / "lerobot" / "calibration")
).expanduser()

SERIAL_BY_ID_DIR = Path(os.environ.get("SERIAL_BY_ID_DIR") or "/dev/serial/by-id").expanduser()

PORT_POLL_INTERVAL_S = 0.4
