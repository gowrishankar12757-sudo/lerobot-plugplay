"""Reads LeRobot's own calibration JSON files so the UI knows which device ids are
already calibrated without re-deriving that state itself."""

from __future__ import annotations

from app.config import HF_LEROBOT_CALIBRATION


def _scan(kind_dir: str, kind: str) -> list[dict]:
    base = HF_LEROBOT_CALIBRATION / kind_dir
    if not base.is_dir():
        return []
    out = []
    for type_dir in sorted(base.iterdir()):
        if not type_dir.is_dir():
            continue
        for calib_file in sorted(type_dir.glob("*.json")):
            out.append(
                {
                    "id": calib_file.stem,
                    "kind": kind,
                    "device_type": type_dir.name,
                    "calibrated_at": calib_file.stat().st_mtime,
                }
            )
    return out


def list_calibrated() -> list[dict]:
    return _scan("robots", "robot") + _scan("teleoperators", "teleop")
