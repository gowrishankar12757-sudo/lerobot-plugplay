import { useEffect, useMemo, useRef, useState } from 'react'
import { Handle, Position } from 'reactflow'
import { BlockShell } from '../components/BlockShell'
import { TerminalView, type TerminalHandle } from '../components/TerminalView'
import { api } from '../lib/api'
import { useFlowStore } from '../store'
import { ROLE_TO_ROBOT_TYPE, type ArmRole, type CalibrateNodeData } from '../lib/types'

export function CalibrateNode({ id, data }: { id: string; data: CalibrateNodeData }) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const removeNode = useFlowStore((s) => s.removeNode)
  const refreshDevices = useFlowStore((s) => s.refreshDevices)
  const systemReady = useFlowStore((s) => s.systemStatus?.ready ?? false)
  const calibratedDevices = useFlowStore((s) => s.calibratedDevices)
  const livePorts = useFlowStore((s) => s.ports)
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const [showTerminal, setShowTerminal] = useState(false)
  const termRef = useRef<TerminalHandle>(null)

  const wiredPort = useMemo(() => {
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'calibrate-in')
    if (!edge) return null
    const portNode = nodes.find((n) => n.id === edge.source)
    return (portNode?.data.path as string) ?? null
  }, [edges, nodes, id])

  // A wire always wins (it's the "plug it in" action) — but the port can also be picked
  // straight from the dropdown below, for a block that hasn't been wired yet.
  useEffect(() => {
    if (wiredPort && wiredPort !== data.port) updateNodeData(id, { port: wiredPort })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wiredPort])

  const locked = !systemReady || !data.port
  const lockedReason = !systemReady ? 'Finish the Install block first' : 'Pick a port below, or wire a USB Device into this block'

  const alreadyCalibrated = calibratedDevices.some(
    (d) => d.id === data.deviceId && d.kind === ROLE_TO_ROBOT_TYPE[data.role].device_kind,
  )

  const busy = data.status === 'running'

  async function runCalibrate() {
    if (!data.port) return
    const { device_kind, type } = ROLE_TO_ROBOT_TYPE[data.role]
    const { run_id } = await api.calibrate({
      device_kind,
      robot_type: type,
      port: data.port,
      device_id: data.deviceId,
    })
    updateNodeData(id, { status: 'running', runId: run_id })
    setShowTerminal(true)
  }

  return (
    <BlockShell
      title="2. Calibrate"
      icon="🎯"
      status={data.status}
      width={360}
      locked={locked}
      lockedReason={lockedReason}
      onDelete={() => removeNode(id)}
    >
      <div className="field-row">
        <label>
          Arm role
          <select
            disabled={busy}
            value={data.role}
            onChange={(e) => updateNodeData(id, { role: e.target.value as ArmRole })}
          >
            <option value="follower">Follower (moves)</option>
            <option value="leader">Leader (you hold it)</option>
          </select>
        </label>
        <label>
          Name / id
          <input
            disabled={busy}
            value={data.deviceId}
            onChange={(e) => updateNodeData(id, { deviceId: e.target.value })}
          />
        </label>
      </div>

      <label className="field-row" style={{ display: 'block' }}>
        Port
        <select
          disabled={busy}
          value={data.port ?? ''}
          onChange={(e) => updateNodeData(id, { port: e.target.value || null })}
        >
          <option value="">— select a detected USB device —</option>
          {livePorts.map((p) => (
            <option key={p.path} value={p.path}>
              {p.label}
            </option>
          ))}
          {data.port && !livePorts.some((p) => p.path === data.port) && (
            <option value={data.port}>{data.port} (not currently plugged in)</option>
          )}
        </select>
      </label>
      {wiredPort && <p className="plugged-yes">🔌 wired from a USB Device block</p>}
      {alreadyCalibrated && <p className="plugged-yes">✓ calibration file already exists for this id</p>}

      <div className="block-actions">
        <button disabled={busy || locked} onClick={runCalibrate}>
          {busy ? 'Calibrating…' : alreadyCalibrated ? 'Recalibrate' : 'Start calibration'}
        </button>
        {busy && (
          <button
            onClick={async () => {
              if (data.runId) await api.stopRun(data.runId, true)
            }}
          >
            Stop
          </button>
        )}
      </div>

      {showTerminal && data.runId && (
        <>
          <TerminalView
            ref={termRef}
            runId={data.runId}
            onStatus={(status) => {
              updateNodeData(id, { status })
              refreshDevices()
            }}
          />
          <div className="quick-keys">
            <button onClick={() => termRef.current?.send('\r')}>⏎ Enter</button>
            <button onClick={() => termRef.current?.send('c\r')}>Recalibrate (c + Enter)</button>
            <button onClick={() => termRef.current?.send('\x03')}>Ctrl+C</button>
          </div>
        </>
      )}

      <Handle type="target" position={Position.Left} id="calibrate-in" style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Right} id="calibrate-out" style={{ background: '#3b82f6' }} />
    </BlockShell>
  )
}
