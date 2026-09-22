from __future__ import annotations

from fastapi import APIRouter

from app.services import devices as devices_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("")
def list_devices():
    return {"devices": devices_service.list_calibrated()}
