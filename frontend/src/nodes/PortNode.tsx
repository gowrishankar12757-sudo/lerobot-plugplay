import { Handle, Position } from 'reactflow'
import { BlockShell } from '../components/BlockShell'
import { useFlowStore } from '../store'
import type { PortNodeData } from '../lib/types'

export function PortNode({ id, data }: { id: string; data: PortNodeData }) {
  const removeNode = useFlowStore((s) => s.removeNode)
  const livePorts = useFlowStore((s) => s.ports)
  const stillPlugged = livePorts.some((p) => p.path === data.path)

  return (
    <BlockShell
      title="USB Device"
      icon="🔌"
      status={stillPlugged ? 'exited' : 'failed'}
      width={220}
      onDelete={() => removeNode(id)}
    >
      <p className="mono-label" title={data.path ?? ''}>
        {data.label}
      </p>
      <p className={stillPlugged ? 'plugged-yes' : 'plugged-no'}>{stillPlugged ? 'plugged in' : 'unplugged'}</p>
      <p className="block-help">Drag a wire from the dot to a Calibrate block.</p>
      <Handle type="source" position={Position.Right} id="port-out" style={{ background: '#22c55e' }} />
    </BlockShell>
  )
}
