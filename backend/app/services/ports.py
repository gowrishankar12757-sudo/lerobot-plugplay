"""Watches /dev/serial/by-id so plugging in an arm's USB cable shows up as a live
ADDED event in the UI — the actual 'wire connector' moment, mirroring the manual
snapshot-diff trick LeRobot's own lerobot-find-port script uses."""

from __future__ import annotations

import asyncio

from app.config import PORT_POLL_INTERVAL_S, SERIAL_BY_ID_DIR


def snapshot() -> list[dict]:
    if not SERIAL_BY_ID_DIR.is_dir():
        return []
    ports = []
    for entry in sorted(SERIAL_BY_ID_DIR.iterdir()):
        try:
            resolved = str((SERIAL_BY_ID_DIR / entry.name).resolve())
        except OSError:
            continue
        ports.append({"label": entry.name, "path": resolved})
    return ports


async def watch(queue: asyncio.Queue) -> None:
    """Pushes {"type": "added"|"removed", "label": ..., "path": ...} events until cancelled."""
    prev = {p["label"]: p for p in snapshot()}
    try:
        while True:
            await asyncio.sleep(PORT_POLL_INTERVAL_S)
            cur = {p["label"]: p for p in snapshot()}
            for label in cur.keys() - prev.keys():
                await queue.put({"type": "added", **cur[label]})
            for label in prev.keys() - cur.keys():
                await queue.put({"type": "removed", **prev[label]})
            prev = cur
    except asyncio.CancelledError:
        pass
