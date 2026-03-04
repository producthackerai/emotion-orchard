import { useMemo } from 'react'
import '../styles/TreeCanvas.css'

function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Quadratic bezier point at parameter t
function quadAt(p0, p1, p2, t) {
  const mt = 1 - t
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2
}

function generateTree(seed) {
  const s = (n) => seededRandom(seed + n)

  // Trunk — gentle curve, wider at base
  const trunkSway = (s(1) - 0.5) * 12
  const trunk = {
    x1: 200, y1: 465,
    cx: 200 + trunkSway, cy: 320,
    x2: 200 + trunkSway * 0.3, y2: 155,
  }

  // Root flare points
  const roots = [
    { x: trunk.x1 - 18, y: trunk.y1 + 5, cx: trunk.x1 - 35, cy: trunk.y1 - 15 },
    { x: trunk.x1 + 18, y: trunk.y1 + 5, cx: trunk.x1 + 35, cy: trunk.y1 - 15 },
  ]

  // Branches — stored as numeric data, NOT svg strings
  const branches = []
  const numBranches = 8

  for (let i = 0; i < numBranches; i++) {
    const t = 0.2 + (i / numBranches) * 0.65
    const side = i % 2 === 0 ? -1 : 1

    // Start point on trunk
    const sx = quadAt(trunk.x1, trunk.cx, trunk.x2, t)
    const sy = quadAt(trunk.y1, trunk.cy, trunk.y2, t)

    // Branch spreads outward and slightly up
    const angleDeg = 20 + s(10 + i) * 40 // 20-60 degrees from horizontal
    const length = 55 + s(20 + i) * 75 + (1 - t) * 20 // longer near bottom
    const rad = angleDeg * Math.PI / 180

    const ex = sx + side * Math.cos(rad) * length
    const ey = sy - Math.sin(rad) * length

    // Control point — slight upward curve
    const cx = sx + side * Math.cos(rad) * length * 0.5 + (s(30 + i) - 0.5) * 15
    const cy = sy - Math.sin(rad) * length * 0.6 - s(40 + i) * 15

    const thickness = 2.5 + (1 - t) * 4

    // Sub-branch from ~60% along main branch
    const subT = 0.5 + s(50 + i) * 0.2
    const subSx = quadAt(sx, cx, ex, subT)
    const subSy = quadAt(sy, cy, ey, subT)
    const subAngle = (15 + s(60 + i) * 30) * Math.PI / 180
    const subLen = length * (0.3 + s(70 + i) * 0.25)
    const subEx = subSx + side * Math.cos(subAngle) * subLen
    const subEy = subSy - Math.sin(subAngle) * subLen
    const subCx = (subSx + subEx) / 2 + (s(80 + i) - 0.5) * 10
    const subCy = (subSy + subEy) / 2 - s(90 + i) * 12

    branches.push({
      sx, sy, cx, cy, ex, ey, thickness, side,
      sub: { sx: subSx, sy: subSy, cx: subCx, cy: subCy, ex: subEx, ey: subEy, thickness: thickness * 0.5 },
    })
  }

  // Leaf positions — computed directly from branch math
  const leafPositions = []

  for (let bi = 0; bi < branches.length; bi++) {
    const b = branches[bi]
    // 3 positions along main branch (50%, 70%, 95%)
    for (const t of [0.5, 0.7, 0.95]) {
      const jx = (s(200 + bi * 20 + t * 100) - 0.5) * 12
      const jy = (s(300 + bi * 20 + t * 100) - 0.5) * 10
      leafPositions.push({
        x: quadAt(b.sx, b.cx, b.ex, t) + jx,
        y: quadAt(b.sy, b.cy, b.ey, t) + jy,
        rotation: (s(400 + bi * 10 + t * 50) - 0.5) * 70,
        scale: 0.9 + s(500 + bi * 10 + t * 50) * 0.4,
      })
    }
    // 2 positions on sub-branch
    for (const t of [0.55, 0.9]) {
      const jx = (s(600 + bi * 20 + t * 100) - 0.5) * 10
      const jy = (s(700 + bi * 20 + t * 100) - 0.5) * 8
      leafPositions.push({
        x: quadAt(b.sub.sx, b.sub.cx, b.sub.ex, t) + jx,
        y: quadAt(b.sub.sy, b.sub.cy, b.sub.ey, t) + jy,
        rotation: (s(800 + bi * 10 + t * 50) - 0.5) * 60,
        scale: 0.8 + s(900 + bi * 10 + t * 50) * 0.35,
      })
    }
  }

  // Crown cluster — leaves near the top of the tree
  const crownX = trunk.x2
  const crownY = trunk.y2
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + s(1000 + i) * 0.5
    const r = 18 + s(1100 + i) * 30
    leafPositions.push({
      x: crownX + Math.cos(a) * r,
      y: crownY - 5 + Math.sin(a) * r * 0.5 - 8,
      rotation: (s(1200 + i) - 0.5) * 50,
      scale: 0.85 + s(1300 + i) * 0.35,
    })
  }

  return { trunk, roots, branches, leafPositions }
}

function LeafShape({ x, y, color, rotation, scale, index, isNew, type = 'leaf' }) {
  const animDelay = isNew ? 0 : index * 0.04

  // IMPORTANT: Outer <g> handles positioning via SVG transform attribute.
  // Inner <g> handles CSS animation. They MUST be separate because CSS
  // animation transform overrides SVG transform attributes.

  if (type === 'blossom') {
    return (
      <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
        <g
          className={isNew ? 'leaf-new' : 'leaf-existing'}
          style={{ animationDelay: `${animDelay}s` }}
        >
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse key={i} cx={0} cy={-6} rx={4} ry={7} fill={color} opacity={0.8} transform={`rotate(${angle})`} />
          ))}
          <circle cx={0} cy={0} r={3} fill="#FFE4B5" opacity={0.9} />
        </g>
      </g>
    )
  }

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <g
        className={isNew ? 'leaf-new' : 'leaf-existing'}
        style={{ animationDelay: `${animDelay}s` }}
      >
        <path
          d="M0,-10 C4,-8 7,-3 7,0 C7,4 4,9 0,11 C-4,9 -7,4 -7,0 C-7,-3 -4,-8 0,-10Z"
          fill={color}
          opacity={0.88}
        />
        <path
          d="M0,-7 Q1,0 0,8 M0,-2 Q3,-4 5,-6 M0,2 Q-3,0 -5,-2"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={0.6}
          fill="none"
        />
      </g>
    </g>
  )
}

export default function TreeCanvas({ leaves = [], treeType = 'emotion', treeSeed = 12345, newLeafId = null }) {
  const tree = useMemo(() => generateTree(treeSeed), [treeSeed])

  const positionedLeaves = leaves.map((leaf, i) => {
    const pos = tree.leafPositions[i % tree.leafPositions.length]
    const cycle = Math.floor(i / tree.leafPositions.length)
    return {
      ...leaf,
      x: pos.x + cycle * (seededRandom(i * 7) - 0.5) * 16,
      y: pos.y + cycle * (seededRandom(i * 13) - 0.5) * 12,
      rotation: pos.rotation + cycle * 20,
      scale: pos.scale * Math.max(0.7, 1 - cycle * 0.15),
    }
  })

  return (
    <div className="tree-canvas-container">
      <svg viewBox="0 0 400 500" className="tree-canvas-svg" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4A2E14" />
            <stop offset="25%" stopColor="#7A5230" />
            <stop offset="50%" stopColor="#9B6B3C" />
            <stop offset="75%" stopColor="#7A5230" />
            <stop offset="100%" stopColor="#4A2E14" />
          </linearGradient>
          <radialGradient id="groundGrad" cx="50%" cy="0%" r="55%">
            <stop offset="0%" stopColor="#1a3a1a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="canopyGlow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#2a4a2a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="leafGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Canopy glow behind leaves */}
        {leaves.length > 3 && (
          <ellipse cx={tree.trunk.x2} cy={tree.trunk.y2 + 40} rx={120 + leaves.length * 2} ry={90 + leaves.length} fill="url(#canopyGlow)" />
        )}

        {/* Ground */}
        <ellipse cx="200" cy="475" rx="150" ry="18" fill="url(#groundGrad)" />

        {/* Root flare */}
        {tree.roots.map((root, i) => (
          <path
            key={i}
            d={`M ${tree.trunk.x1} ${tree.trunk.y1} Q ${root.cx} ${root.cy} ${root.x} ${root.y}`}
            stroke="url(#trunkGrad)"
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* Trunk */}
        <path
          d={`M ${tree.trunk.x1} ${tree.trunk.y1} Q ${tree.trunk.cx} ${tree.trunk.cy} ${tree.trunk.x2} ${tree.trunk.y2}`}
          stroke="url(#trunkGrad)"
          strokeWidth={16}
          strokeLinecap="round"
          fill="none"
          className="tree-trunk"
        />
        {/* Trunk bark highlight */}
        <path
          d={`M ${tree.trunk.x1 + 3} ${tree.trunk.y1} Q ${tree.trunk.cx + 3} ${tree.trunk.cy} ${tree.trunk.x2 + 2} ${tree.trunk.y2}`}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {/* Branches */}
        <g className="tree-branches">
          {tree.branches.map((b, i) => (
            <g key={i}>
              <path
                d={`M ${b.sx} ${b.sy} Q ${b.cx} ${b.cy} ${b.ex} ${b.ey}`}
                stroke="#6B4226"
                strokeWidth={b.thickness}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={`M ${b.sub.sx} ${b.sub.sy} Q ${b.sub.cx} ${b.sub.cy} ${b.sub.ex} ${b.sub.ey}`}
                stroke="#7A5230"
                strokeWidth={b.sub.thickness}
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ))}
        </g>

        {/* Leaves */}
        <g className="tree-leaves">
          {positionedLeaves.map((leaf, i) => (
            <LeafShape
              key={leaf.id || i}
              x={leaf.x}
              y={leaf.y}
              color={leaf.color}
              rotation={leaf.rotation}
              scale={leaf.scale}
              index={i}
              isNew={leaf.id === newLeafId}
              type={treeType === 'gratitude' ? 'blossom' : 'leaf'}
            />
          ))}
        </g>

        {/* Fireflies */}
        {leaves.length > 5 && (
          <g className="ambient-particles">
            {[...Array(4)].map((_, i) => (
              <circle
                key={i}
                cx={80 + i * 80 + Math.sin(i * 3) * 40}
                cy={120 + i * 50 + Math.cos(i * 2) * 30}
                r={1.5}
                fill="#f59e0b"
                opacity={0.25}
                className="firefly"
                style={{ animationDelay: `${i * 1.3}s` }}
              />
            ))}
          </g>
        )}
      </svg>

      <div className="tree-leaf-count">{leaves.length} / 30</div>
    </div>
  )
}
