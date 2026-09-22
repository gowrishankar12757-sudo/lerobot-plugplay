from __future__ import annotations

import asyncio
import base64

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.config import LEROBOT_REPO
from app.services import commands
from app.services.pty_runner import registry

router = APIRouter(prefix="/api/runs", tags=["runs"])


class CalibrateRequest(BaseModel):
    device_kind: str  # "robot" | "teleop"
    robot_type: str  # e.g. "so101_follower" / "so101_leader"
    port: str
    device_id: str


class TeleoperateRequest(BaseModel):
    robot_type: str
    robot_port: str
    robot_id: str
    teleop_type: str
    teleop_port: str
    teleop_id: str
    fps: int = 30
    display_data: bool = False


@router.post("/calibrate")
async def start_calibrate(req: CalibrateRequest):
    if req.device_kind not in ("robot", "teleop"):
        raise HTTPException(400, "device_kind must be 'robot' or 'teleop'")
    argv = commands.calibrate_argv(req.device_kind, req.robot_type, req.port, req.device_id)
    handle = await registry.start("calibrate", argv, cwd=LEROBOT_REPO)
    return {"run_id": handle.id}


@router.post("/teleoperate")
async def start_teleoperate(req: TeleoperateRequest):
    argv = commands.teleoperate_argv(
        req.robot_type,
        req.robot_port,
        req.robot_id,
        req.teleop_type,
        req.teleop_port,
        req.teleop_id,
        fps=req.fps,
        display_data=req.display_data,
    )
    handle = await registry.start("teleoperate", argv, cwd=LEROBOT_REPO)
    return {"run_id": handle.id}


@router.get("/{run_id}")
def get_run(run_id: str):
    handle = registry.get(run_id)
    if handle is None:
        raise HTTPException(404, "unknown run_id")
    return {
        "id": handle.id,
        "kind": handle.kind,
        "status": handle.status,
        "exit_code": handle.exit_code,
        "argv": handle.argv,
    }


@router.post("/{run_id}/stop")
def stop_run(run_id: str, force: bool = False):
    ok = registry.stop(run_id, force=force)
    if not ok:
        raise HTTPException(404, "run not active")
    return {"stopped": True}


@router.websocket("/{run_id}/stream")
async def stream_run(ws: WebSocket, run_id: str):
    handle = registry.get(run_id)
    if handle is None:
        await ws.close(code=4404)
        return
    await ws.accept()

    queue = handle.subscribe()
    backlog = handle.snapshot()
    if backlog:
        await ws.send_json({"type": "output", "data": base64.b64encode(backlog).decode()})
    if handle.status != "running":
        await ws.send_json({"type": "status", "status": handle.status, "exit_code": handle.exit_code})

    async def pump_output():
        while True:
            chunk = await queue.get()
            if chunk is None:
                await ws.send_json({"type": "status", "status": handle.status, "exit_code": handle.exit_code})
                break
            await ws.send_json({"type": "output", "data": base64.b64encode(chunk).decode()})

    pump_task = asyncio.create_task(pump_output())
    try:
        while True:
            msg = await ws.receive_json()
            if msg.get("type") == "stdin":
                registry.write(run_id, base64.b64decode(msg["data"]))
            elif msg.get("type") == "resize":
                registry.resize(run_id, rows=int(msg.get("rows", 32)), cols=int(msg.get("cols", 120)))
            elif msg.get("type") == "stop":
                registry.stop(run_id, force=bool(msg.get("force", False)))
    except WebSocketDisconnect:
        pass
    finally:
        handle.unsubscribe(queue)
        pump_task.cancel()
