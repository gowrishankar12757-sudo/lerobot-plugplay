import type { CalibratedDevice, PortInfo, SystemStatus } from './types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export const api = {
  systemStatus: () => fetch('/api/system/status').then((r) => json<SystemStatus>(r)),
  install: () => fetch('/api/system/install', { method: 'POST' }).then((r) => json<{ run_id: string }>(r)),

  ports: () => fetch('/api/ports').then((r) => json<{ ports: PortInfo[] }>(r)),

  devices: () => fetch('/api/devices').then((r) => json<{ devices: CalibratedDevice[] }>(r)),

  calibrate: (body: { device_kind: 'robot' | 'teleop'; robot_type: string; port: string; device_id: string }) =>
    fetch('/api/runs/calibrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<{ run_id: string }>(r)),

  teleoperate: (body: {
    robot_type: string
    robot_port: string
    robot_id: string
    teleop_type: string
    teleop_port: string
    teleop_id: string
    fps: number
    display_data: boolean
  }) =>
    fetch('/api/runs/teleoperate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<{ run_id: string }>(r)),

  stopRun: (runId: string, force = false) =>
    fetch(`/api/runs/${runId}/stop?force=${force}`, { method: 'POST' }).then((r) => json(r)),
}

export function portsWatchSocket(onEvent: (event: any) => void): WebSocket {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${location.host}/api/ports/watch`)
  ws.onmessage = (ev) => onEvent(JSON.parse(ev.data))
  return ws
}

export function runStreamSocket(runId: string): WebSocket {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return new WebSocket(`${proto}://${location.host}/api/runs/${runId}/stream`)
}
