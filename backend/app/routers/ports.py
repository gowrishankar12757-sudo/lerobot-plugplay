from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services import ports as ports_service

router = APIRouter(prefix="/api/ports", tags=["ports"])


@router.get("")
def list_ports():
    return {"ports": ports_service.snapshot()}


@router.websocket("/watch")
async def watch_ports(ws: WebSocket):
    await ws.accept()
    queue: asyncio.Queue = asyncio.Queue()
    watcher = asyncio.create_task(ports_service.watch(queue))
    try:
        await ws.send_json({"type": "snapshot", "ports": ports_service.snapshot()})
        while True:
            event = await queue.get()
            await ws.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        watcher.cancel()
