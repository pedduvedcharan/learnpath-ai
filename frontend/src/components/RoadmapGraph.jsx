import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'

function RoadmapNode({ data }) {
  const { label, status, index, totalNodes } = data

  const statusStyles = {
    complete: {
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      text: 'text-green-400',
      icon: '\u2713',
      opacity: '',
    },
    current: {
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500',
      text: 'text-cyan-400',
      icon: '\u25B6',
      opacity: '',
    },
    locked: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-600',
      text: 'text-slate-500',
      icon: '\uD83D\uDD12',
      opacity: 'opacity-50',
    },
  }

  const s = statusStyles[status] || statusStyles.locked

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.2, duration: 0.4, ease: 'easeOut' }}
    >
      <div
        className={`rounded-xl px-4 py-3 border-2 ${s.bg} ${s.border} ${s.opacity} ${
          status === 'current' ? 'scale-110 animate-pulse-glow' : ''
        } transition-all cursor-pointer hover:brightness-125`}
        style={{ minWidth: 140, textAlign: 'center' }}
      >
        <div className={`text-lg mb-1 ${s.text}`}>{s.icon}</div>
        <div className={`text-sm font-semibold ${s.text}`}>{label}</div>
      </div>
      {index > 0 && (
        <Handle type="target" position={Position.Left} className="opacity-0" />
      )}
      {index < totalNodes - 1 && (
        <Handle type="source" position={Position.Right} className="opacity-0" />
      )}
    </motion.div>
  )
}

const nodeTypes = { roadmapNode: RoadmapNode }

export default function RoadmapGraph({ roadmap = [], onNodeClick }) {
  const spacing = 220

  const nodes = useMemo(
    () =>
      roadmap.map((item, i) => ({
        id: `node-${i}`,
        type: 'roadmapNode',
        position: { x: i * spacing, y: 50 },
        data: {
          label: item.node,
          status: item.status,
          description: item.description,
          index: i,
          totalNodes: roadmap.length,
        },
      })),
    [roadmap]
  )

  const edges = useMemo(
    () =>
      roadmap.slice(0, -1).map((item, i) => {
        const nextStatus = roadmap[i + 1]?.status
        const isActive =
          item.status === 'complete' ||
          item.status === 'current' ||
          nextStatus === 'current'
        return {
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
          type: 'default',
          animated: isActive,
          style: {
            stroke: isActive ? '#0ea5e9' : '#475569',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: isActive ? '#0ea5e9' : '#475569',
          },
        }
      }),
    [roadmap]
  )

  const handleNodeClick = useCallback(
    (_, node) => {
      const index = parseInt(node.id.split('-')[1], 10)
      onNodeClick?.(index)
    },
    [onNodeClick]
  )

  return (
    <div className="w-full h-[200px] rounded-2xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        style={{ background: 'transparent' }}
      >
        <Background variant="dots" gap={20} size={0.5} color="#1e293b" />
      </ReactFlow>
    </div>
  )
}
