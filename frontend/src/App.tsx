import { useEffect } from 'react'
import ReactFlow, { Background, Controls, MiniMap, Panel, ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import { nodeTypes } from './nodes'
import { portsWatchSocket } from './lib/api'
import { useFlowStore } from './store'

function Toolbar() {
  const ports = useFlowStore((s) => s.ports)
  const addPortNode = useFlowStore((s) => s.addPortNode)
  const addCalibrateNode = useFlowStore((s) => s.addCalibrateNode)
  const addTeleoperateNode = useFlowStore((s) => s.addTeleoperateNode)
  const nodes = useFlowStore((s) => s.nodes)

  const placedPaths = new Set(nodes.filter((n) => n.type === 'port').map((n) => n.data.path))
  const newPorts = ports.filter((p) => !placedPaths.has(p.path))

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <span className="toolbar-label">Detected USB devices:</span>
        {ports.length === 0 && <span className="toolbar-hint">none plugged in — plug in an arm's USB cable</span>}
        {newPorts.map((p) => (
          <button key={p.path} className="toolbar-add-port" onClick={() => addPortNode(p)}>
            + {p.label}
          </button>
        ))}
      </div>
      <div className="toolbar-group">
        <button onClick={addCalibrateNode}>+ Calibrate block</button>
        <button onClick={addTeleoperateNode}>+ Teleoperate block</button>
      </div>
    </div>
  )
}

function Canvas() {
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const onConnect = useFlowStore((s) => s.onConnect)
  const isValidConnection = useFlowStore((s) => s.isValidConnection)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes as any}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      fitView
      minZoom={0.3}
    >
      <Background gap={24} color="#1f2937" />
      <MiniMap pannable zoomable style={{ background: '#0d1117' }} />
      <Controls />
      <Panel position="top-left">
        <div className="brand-panel">
          <span className="brand-panel-name">Get Set Robotics</span>
          <span className="brand-panel-sub">LeRobot SO101</span>
        </div>
      </Panel>
      <Panel position="top-center">
        <div className="action-map-title">Action Graph</div>
      </Panel>
    </ReactFlow>
  )
}

export default function App() {
  const setPorts = useFlowStore((s) => s.setPorts)
  const refreshSystemStatus = useFlowStore((s) => s.refreshSystemStatus)
  const refreshDevices = useFlowStore((s) => s.refreshDevices)

  useEffect(() => {
    refreshSystemStatus()
    refreshDevices()

    const ws = portsWatchSocket((event) => {
      if (event.type === 'snapshot') {
        setPorts(event.ports)
        return
      }
      const current = useFlowStore.getState().ports
      if (event.type === 'added') {
        setPorts([...current.filter((p) => p.path !== event.path), { label: event.label, path: event.path }])
      } else if (event.type === 'removed') {
        setPorts(current.filter((p) => p.path !== event.path))
      }
    })
    return () => ws.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-root">
      <Toolbar />
      <div className="canvas-wrap">
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
