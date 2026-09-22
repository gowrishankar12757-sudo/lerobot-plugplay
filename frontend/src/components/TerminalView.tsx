import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { runStreamSocket } from '../lib/api'
import type { RunStatus } from '../lib/types'

export interface TerminalHandle {
  send: (text: string) => void
}

interface Props {
  runId: string
  onStatus?: (status: RunStatus, exitCode: number | null) => void
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export const TerminalView = forwardRef<TerminalHandle, Props>(function TerminalView({ runId, onStatus }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const termRef = useRef<Terminal | null>(null)

  useImperativeHandle(ref, () => ({
    send(text: string) {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      const bytes = new TextEncoder().encode(text)
      ws.send(JSON.stringify({ type: 'stdin', data: bytesToB64(bytes) }))
    },
  }))

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({
      convertEol: true,
      fontSize: 13,
      fontFamily: 'Menlo, Consolas, monospace',
      theme: { background: '#0d1117', foreground: '#c9d1d9' },
      scrollback: 5000,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term

    const ws = runStreamSocket(runId)
    wsRef.current = ws

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'output') {
        term.write(b64ToBytes(msg.data))
      } else if (msg.type === 'status') {
        onStatus?.(msg.status, msg.exit_code ?? null)
      }
    }

    term.onData((data) => {
      ws.send(JSON.stringify({ type: 'stdin', data: bytesToB64(new TextEncoder().encode(data)) }))
    })

    const resizeObserver = new ResizeObserver(() => {
      fit.fit()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', rows: term.rows, cols: term.cols }))
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      ws.close()
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  return <div ref={containerRef} style={{ height: '260px', width: '100%' }} />
})
