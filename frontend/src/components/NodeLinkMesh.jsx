import { motion } from 'framer-motion'

/**
 * Parallax mesh: background layer (small, blurred, slow) + foreground (bright, faster drift).
 * Lines only between node pairs within radius; opacity pulses for a live network feel.
 */
const VIEW = 100

function buildEdges(nodes, maxDist) {
  const maxSq = maxDist * maxDist
  const edges = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      if (dx * dx + dy * dy <= maxSq) {
        edges.push([i, j])
      }
    }
  }
  return edges
}

/** Foreground — primary lattice */
const NODES_FG = [
  { id: 'f0', x: 14, y: 20 },
  { id: 'f1', x: 38, y: 14 },
  { id: 'f2', x: 62, y: 22 },
  { id: 'f3', x: 86, y: 36 },
  { id: 'f4', x: 22, y: 46 },
  { id: 'f5', x: 50, y: 42 },
  { id: 'f6', x: 76, y: 54 },
  { id: 'f7', x: 12, y: 68 },
  { id: 'f8', x: 40, y: 64 },
  { id: 'f9', x: 64, y: 76 },
  { id: 'f10', x: 88, y: 80 },
  { id: 'f11', x: 48, y: 88 },
]

/** Background — offset / denser field for depth */
const NODES_BG = [
  { id: 'b0', x: 8, y: 12 },
  { id: 'b1', x: 28, y: 8 },
  { id: 'b2', x: 52, y: 10 },
  { id: 'b3', x: 78, y: 18 },
  { id: 'b4', x: 18, y: 38 },
  { id: 'b5', x: 44, y: 32 },
  { id: 'b6', x: 70, y: 44 },
  { id: 'b7', x: 6, y: 58 },
  { id: 'b8', x: 32, y: 52 },
  { id: 'b9', x: 58, y: 62 },
  { id: 'b10', x: 84, y: 70 },
  { id: 'b11', x: 46, y: 78 },
]

const EDGES_FG = buildEdges(NODES_FG, 34)
const EDGES_BG = buildEdges(NODES_BG, 30)

export default function NodeLinkMesh({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 h-full min-h-full w-full min-w-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 block h-full w-full object-cover"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id="meshLineFg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
          </linearGradient>
          <linearGradient id="meshLineBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
          <filter
            id="meshDepthBlur"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.15" />
          </filter>
        </defs>

        {/* Background layer: depth of field */}
        <motion.g
          filter="url(#meshDepthBlur)"
          opacity={0.55}
          animate={{
            x: [0, -2.5, 2, -1, 0],
            y: [0, 1.8, -2.2, 1, 0],
          }}
          transition={{
            duration: 56,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {EDGES_BG.map(([a, b], i) => {
            const na = NODES_BG[a]
            const nb = NODES_BG[b]
            return (
              <motion.line
                key={`bg-${a}-${b}-${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="url(#meshLineBg)"
                strokeWidth={0.45}
                strokeLinecap="round"
                animate={{
                  opacity: [0.12, 0.38, 0.15, 0.32, 0.14],
                }}
                transition={{
                  duration: 11 + (i % 5) * 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.28,
                }}
              />
            )
          })}
          {NODES_BG.map((n, idx) => (
            <motion.circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={1.35}
              fill="rgba(255,255,255,0.42)"
              animate={{
                cx: [n.x, n.x - 0.9, n.x + 0.7, n.x],
                cy: [n.y, n.y + 0.8, n.y - 0.6, n.y],
                opacity: [0.35, 0.55, 0.4, 0.5, 0.38],
              }}
              transition={{
                cx: {
                  duration: 38 + idx * 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                cy: {
                  duration: 44 + idx * 0.9,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                opacity: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          ))}
        </motion.g>

        {/* Foreground layer: crisp, brighter, faster drift */}
        <motion.g
          animate={{
            x: [0, 3.8, -2.5, 2.2, 0],
            y: [0, -2.8, 2.2, -1.4, 0],
            rotate: [0, 0.35, -0.25, 0],
          }}
          transition={{
            duration: 36,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {EDGES_FG.map(([a, b], i) => {
            const na = NODES_FG[a]
            const nb = NODES_FG[b]
            return (
              <motion.line
                key={`fg-${a}-${b}-${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="url(#meshLineFg)"
                strokeWidth={0.7}
                strokeLinecap="round"
                animate={{
                  opacity: [0.22, 0.58, 0.28, 0.52, 0.24],
                }}
                transition={{
                  duration: 7.5 + (i % 6) * 1.1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.32,
                }}
              />
            )
          })}
          {NODES_FG.map((n, idx) => (
            <motion.circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={2.65}
              fill="rgba(255,255,255,0.95)"
              animate={{
                cx: [
                  n.x,
                  n.x + 1.8,
                  n.x - 1.2,
                  n.x + 0.9,
                  n.x,
                ],
                cy: [
                  n.y,
                  n.y - 1.5,
                  n.y + 1.3,
                  n.y - 0.7,
                  n.y,
                ],
                opacity: [0.72, 1, 0.78, 0.95, 0.75],
              }}
              transition={{
                cx: {
                  duration: 20 + idx * 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                cy: {
                  duration: 24 + idx * 0.95,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                opacity: {
                  duration: 9 + (idx % 5),
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />
          ))}
        </motion.g>
      </svg>

      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-black/20"
        animate={{ opacity: [0.42, 0.68, 0.48] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
