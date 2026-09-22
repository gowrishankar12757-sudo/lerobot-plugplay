from __future__ import annotations

from fastapi import APIRouter

from app.config import LEROBOT_REPO
from app.services import commands, system_check
from app.services.pty_runner import registry

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/status")
def status():
    checks = system_check.run_checks()
    return {"repo": str(LEROBOT_REPO), "ready": system_check.is_ready(checks), "checks": checks}


@router.post("/install")
async def install():
    handle = await registry.start("install", commands.install_argv(), cwd=LEROBOT_REPO)
    return {"run_id": handle.id}
