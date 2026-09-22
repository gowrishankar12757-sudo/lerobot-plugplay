import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from 'reactflow'
import { create } from 'zustand'
import { api } from './lib/api'
import type { CalibratedDevice, PortInfo, SystemStatus } from './lib/types'

let portCounter = 0
let calibrateCounter = 0
let teleopCounter = 0

interface FlowState {
  nodes: Node[]
  edges: Edge[]
  ports: PortInfo[]
  systemStatus: SystemStatus | null
  calibratedDevices: CalibratedDevice[]

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  isValidConnection: (connection: Connection) => boolean

  updateNodeData: (id: string, patch: Record<string, unknown>) => void
  setPorts: (ports: PortInfo[]) => void
  refreshSystemStatus: () => Promise<void>
  refreshDevices: () => Promise<void>

  addPortNode: (port: PortInfo) => void
  addCalibrateNode: () => void
  addTeleoperateNode: () => void
  removeNode: (id: string) => void
}

const VALID_LINKS: Record<string, string> = {
  'port-out->calibrate-in': 'ok',
  'calibrate-out->teleop-leader-in': 'ok',
  'calibrate-out->teleop-follower-in': 'ok',
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [
    {
      id: 'install',
      type: 'install',
      position: { x: 40, y: 220 },
      data: { kind: 'install', status: 'idle', runId: null },
      deletable: false,
    },
  ],
  edges: [],
  ports: [],
  systemStatus: null,
  calibratedDevices: [],

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

  isValidConnection: (connection) => {
    const key = `${connection.sourceHandle}->${connection.targetHandle}`
    if (!VALID_LINKS[key]) return false

    const { nodes, edges } = get()
    const source = nodes.find((n) => n.id === connection.source)
    if (!source) return false

    // A leader-calibrated arm can only feed the teleop node's leader input, and vice versa.
    if (connection.targetHandle === 'teleop-leader-in' && source.data.role !== 'leader') return false
    if (connection.targetHandle === 'teleop-follower-in' && source.data.role !== 'follower') return false

    // Each target handle accepts exactly one wire, except a port can feed only one calibrate block too.
    const alreadyWired = edges.some(
      (e) => e.target === connection.target && e.targetHandle === connection.targetHandle,
    )
    if (alreadyWired) return false

    return true
  },

  onConnect: (connection) => {
    if (!get().isValidConnection(connection)) return
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) })
  },

  updateNodeData: (id, patch) =>
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    }),

  setPorts: (ports) => set({ ports }),

  refreshSystemStatus: async () => {
    const status = await api.systemStatus()
    set({ systemStatus: status })
    get().updateNodeData('install', { status: status.ready ? 'exited' : 'idle' })
  },

  refreshDevices: async () => {
    const { devices } = await api.devices()
    set({ calibratedDevices: devices })
  },

  addPortNode: (port) => {
    portCounter += 1
    const id = `port-${portCounter}`
    const node: Node = {
      id,
      type: 'port',
      position: { x: 320, y: 40 + ((portCounter - 1) % 6) * 90 },
      data: { kind: 'port', label: port.label, path: port.path, connected: true },
    }
    set({ nodes: [...get().nodes, node] })
  },

  addCalibrateNode: () => {
    calibrateCounter += 1
    const id = `calibrate-${calibrateCounter}`
    const node: Node = {
      id,
      type: 'calibrate',
      position: { x: 620, y: 40 + ((calibrateCounter - 1) % 6) * 130 },
      data: {
        kind: 'calibrate',
        role: 'follower',
        deviceId: `arm${calibrateCounter}`,
        port: null,
        status: 'idle',
        runId: null,
        alreadyCalibrated: false,
      },
    }
    set({ nodes: [...get().nodes, node] })
  },

  addTeleoperateNode: () => {
    teleopCounter += 1
    const id = `teleoperate-${teleopCounter}`
    const node: Node = {
      id,
      type: 'teleoperate',
      position: { x: 980, y: 60 + (teleopCounter - 1) * 200 },
      data: { kind: 'teleoperate', status: 'idle', runId: null, fps: 30 },
    }
    set({ nodes: [...get().nodes, node] })
  },

  removeNode: (id) =>
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    }),
}))
