import { useMemo, useState } from 'react'
import { Handle, Position, type Node } from 'reactflow'
import { BlockShell } from '../components/BlockShell'
import { TerminalView } from '../components/TerminalView'
import { api } from '../lib/api'
import { useFlowStore } from '../store'
import { ROLE_TO_ROBOT_TYPE, type CalibrateNodeData, type TeleoperateNodeData } from '../lib/types'

function resolveArm(nodes: Node[], edges: any[], targetId: string, handle: string, calibratedDevices: any[]) {
  const edge = edges.find((e) => e.target === targetId && e.targetHandle === handle)
  if (!edge) return null
  const node = nodes.find((n) => n.id === edge.source)
  if (!node) return null
  const data = node.data as CalibrateNodeData
  const alreadyCalibrated = calibratedDevices.some(
    (d) => d.id === data.deviceId && d.kind === ROLE_TO_ROBOT_TYPE[data.role].device_kind,
  )
  const ready = data.status === 'exited' || alreadyCalibrated
  return { data, ready }
}

export function TeleoperateNode({ id, data }: { id: string; data: TeleoperateNodeData }) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const removeNode = useFlowStore((s) => s.removeNode)
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const calibratedDevices = useFlowStore((s) => s.calibratedDevices)
  const [showTerminal, setShowTerminal] = useState(false)

  const leader = useMemo(
    () => resolveArm(nodes, edges, id, 'teleop-leader-in', calibratedDevices),
    [nodes, edges, id, calibratedDevices],
  )
  const follower = useMemo(
    () => resolveArm(nodes, edges, id, 'teleop-follower-in', calibratedDevices),
    [nodes, edges, id, calibratedDevices],
  )

  const locked = !leader?.ready || !follower?.ready
  const lockedReason = !leader
    ? 'Wire a calibrated Leader arm in'
    : !follower
      ? 'Wire a calibrated Follower arm in'
      : 'Finish calibrating both wired arms first'

  const busy = data.status === 'running'

  async function runTeleoperate() {
    if (!leader || !follower) return
    const { run_id } = await api.teleoperate({
      robot_type: ROLE_TO_ROBOT_TYPE[follower.data.role].type,
      robot_port: follower.data.port ?? '',
      robot_id: follower.data.deviceId,
      teleop_type: ROLE_TO_ROBOT_TYPE[leader.data.role].type,
      teleop_port: leader.data.port ?? '',
      teleop_id: leader.data.deviceId,
      fps: data.fps,
      display_data: false,
    })
    updateNodeData(id, { status: 'running', runId: run_id })
    setShowTerminal(true)
  }

  return (
    <BlockShell
      title="3. Teleoperate"
      icon="🕹️"
      status={data.status}
      width={380}
      locked={locked}
      lockedReason={lockedReason}
      onDelete={() => removeNode(id)}
    >
      <p className="block-help">
        Leader: <b>{leader?.data.deviceId ?? '—'}</b> · Follower: <b>{follower?.data.deviceId ?? '—'}</b>
      </p>
      <label className="field-row">
        FPS
        <input
          type="number"
          min={1}
          max={60}
          disabled={busy}
          value={data.fps}
          onChange={(e) => updateNodeData(id, { fps: Number(e.target.value) })}
        />
      </label>

      <div className="block-actions">
        <button disabled={busy || locked} onClick={runTeleoperate}>
          {busy ? 'Teleoperating…' : 'Start teleoperation'}
        </button>
        {busy && (
          <button
            onClick={async () => {
              if (data.runId) await api.stopRun(data.runId)
            }}
          >
            Stop
          </button>
        )}
      </div>

      {showTerminal && data.runId && (
        <TerminalView runId={data.runId} onStatus={(status) => updateNodeData(id, { status })} />
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="teleop-leader-in"
        style={{ top: '40%', background: '#a855f7' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="teleop-follower-in"
        style={{ top: '65%', background: '#3b82f6' }}
      />
    </BlockShell>
  )
}
