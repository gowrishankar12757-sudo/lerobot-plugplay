export type RunStatus = 'idle' | 'running' | 'exited' | 'failed' | 'stopped'

export interface SystemCheck {
  id: string
  label: string
  ok: boolean
  fix: string | null
  optional: boolean
}

export interface SystemStatus {
  repo: string
  ready: boolean
  checks: SystemCheck[]
}

export interface PortInfo {
  label: string
  path: string
}

export interface CalibratedDevice {
  id: string
  kind: 'robot' | 'teleop'
  device_type: string
  calibrated_at: number
}

export type ArmRole = 'follower' | 'leader'

export const ROLE_TO_ROBOT_TYPE: Record<ArmRole, { device_kind: 'robot' | 'teleop'; type: string }> = {
  follower: { device_kind: 'robot', type: 'so101_follower' },
  leader: { device_kind: 'teleop', type: 'so101_leader' },
}

export interface PortNodeData {
  kind: 'port'
  label: string
  path: string | null
  connected: boolean
}

export interface InstallNodeData {
  kind: 'install'
  status: RunStatus
  runId: string | null
}

export interface CalibrateNodeData {
  kind: 'calibrate'
  role: ArmRole
  deviceId: string
  port: string | null
  status: RunStatus
  runId: string | null
  alreadyCalibrated: boolean
}

export interface TeleoperateNodeData {
  kind: 'teleoperate'
  status: RunStatus
  runId: string | null
  fps: number
}

export type AppNodeData = PortNodeData | InstallNodeData | CalibrateNodeData | TeleoperateNodeData
