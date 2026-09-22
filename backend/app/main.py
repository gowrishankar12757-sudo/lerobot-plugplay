from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import devices, ports, runs, system

app = FastAPI(title="LeRobot Plug & Play")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(ports.router)
app.include_router(devices.router)
app.include_router(runs.router)


@app.get("/api/health")
def health():
    return {"ok": True}
