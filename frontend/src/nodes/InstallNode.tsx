import { useState } from 'react'
import { BlockShell } from '../components/BlockShell'
import { TerminalView } from '../components/TerminalView'
import { api } from '../lib/api'
import { useFlowStore } from '../store'
import type { InstallNodeData } from '../lib/types'

export function InstallNode({ id, data }: { id: string; data: InstallNodeData }) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const refreshSystemStatus = useFlowStore((s) => s.refreshSystemStatus)
  const systemStatus = useFlowStore((s) => s.systemStatus)
  const [showTerminal, setShowTerminal] = useState(false)

  const busy = data.status === 'running'

  async function runInstall() {
    const { run_id } = await api.install()
    updateNodeData(id, { status: 'running', runId: run_id })
    setShowTerminal(true)
  }

  return (
    <BlockShell title="1. Install Dependencies" icon="📦" status={data.status} width={380}>
      <p className="block-help">Sets up LeRobot's Python environment and the SO-101 motor driver, once.</p>

      {systemStatus && (
        <ul className="check-list">
          {systemStatus.checks.map((c) => (
            <li key={c.id} className={c.ok ? 'check-ok' : c.optional ? 'check-optional' : 'check-bad'}>
              {c.ok ? '✓' : c.optional ? '–' : '✗'} {c.label}
            </li>
          ))}
        </ul>
      )}

      <div className="block-actions">
        <button disabled={busy} onClick={runInstall}>
          {busy ? 'Installing…' : systemStatus?.ready ? 'Re-run install' : 'Install now'}
        </button>
        <button
          onClick={async () => {
            await refreshSystemStatus()
          }}
        >
          Re-check
        </button>
      </div>

      {showTerminal && data.runId && (
        <TerminalView
          runId={data.runId}
          onStatus={(status) => {
            updateNodeData(id, { status })
            refreshSystemStatus()
          }}
        />
      )}
    </BlockShell>
  )
}
