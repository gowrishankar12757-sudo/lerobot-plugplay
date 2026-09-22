import { CalibrateNode } from './CalibrateNode'
import { InstallNode } from './InstallNode'
import { PortNode } from './PortNode'
import { TeleoperateNode } from './TeleoperateNode'

export const nodeTypes = {
  install: InstallNode,
  port: PortNode,
  calibrate: CalibrateNode,
  teleoperate: TeleoperateNode,
} as const
