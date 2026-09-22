import type { ReactNode } from 'react'
import type { RunStatus } from '../lib/types'

const STATUS_COLOR: Record<RunStatus, string> = {
  idle: '#4b5563',
  running: '#3b82f6',
  exited: '#22c55e',
  failed: '#ef4444',
  stopped: '#f59e0b',
}

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: 'not run yet',
  running: 'running…',
  exited: 'done',
  failed: 'failed',
  stopped: 'stopped',
}

interface Props {
  title: string
  icon: string
  status: RunStatus
  locked?: boolean
  lockedReason?: string
  width?: number
  onDelete?: () => void
  children?: ReactNode
}

export function BlockShell({ title, icon, status, locked, lockedReason, width = 300, onDelete, children }: Props) {
  const color = locked ? '#374151' : STATUS_COLOR[status]
  return (
    <div
      className="block-shell"
      style={{
        width,
        borderColor: color,
        boxShadow: status === 'running' ? `0 0 14px ${color}` : undefined,
      }}
    >
      <div className="block-shell-header">
        <span className="block-icon">{icon}</span>
        <span className="block-title">{title}</span>
        <span className="status-dot" style={{ background: color }} title={STATUS_LABEL[status]} />
        {onDelete && (
          <button className="block-delete" onClick={onDelete} title="Remove block">
            ×
          </button>
        )}
      </div>
      {/* Fields, selectors and connector handles always render — only the Run/Start action itself
          is gated on `locked`. Hiding whole sections here in the past made it impossible to ever
          satisfy the lock condition (e.g. no port dropdown visible until a port was already set). */}
      <div className="block-shell-body">
        {locked && <div className="block-locked-banner">🔒 {lockedReason ?? 'Not ready yet'}</div>}
        {children}
      </div>
    </div>
  )
}
