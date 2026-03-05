import { useMemo } from 'react'
import '../styles/TreeCanvas.css'

function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function quadAt(p0, p1, p2, t) {
  const mt = 1 - t
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2
}

// Elegant Tree of Life — sweeping curved branches, circular canopy
function generateTree(seed) {
  const s = (n) => seededRandom(seed + n)

  const cx = 200 // center x
  const trunkBottom = 455
  const trunkTop = 195
  const sway = (s(1) - 0.5) * 8

  const trunk = {
    x1: cx, y1: trunkBottom,
    cx: cx + sway, cy: (trunkBottom + trunkTop) / 2,
    x2: cx + sway * 0.3, y2: trunkTop,
  }

  // Root flare — gentle curves mirroring branches
  const roots = [
    { x1: cx, y1: trunkBottom, cx: cx - 25, cy: trunkBottom + 5, x2: cx - 40, y2: trunkBottom + 12 },
    { x1: cx, y1: trunkBottom, cx: cx + 25, cy: trunkBottom + 5, x2: cx + 40, y2: trunkBottom + 12 },
    { x1: cx, y1: trunkBottom, cx: cx - 12, cy: trunkBottom + 8, x2: cx - 22, y2: trunkBottom + 18 },
    { x1: cx, y1: trunkBottom, cx: cx + 12, cy: trunkBottom + 8, x2: cx + 22, y2: trunkBottom + 18 },
  ]

  // Tree of Life branches — graceful sweeping curves
  // Each pair is symmetrical left/right
  const branchDefs = [
    // Lower pair — widest sweep
    { tOnTrunk: 0.55, angle: 65, length: 110, curve: 40 },
    // Middle pair
    { tOnTrunk: 0.45, angle: 50, length: 95, curve: 35 },
    // Upper-mid pair
    { tOnTrunk: 0.30, angle: 40, length: 80, curve: 25 },
    // Top pair — more vertical
    { tOnTrunk: 0.18, angle: 25, length: 65, curve: 15 },
    // Crown branches — nearly vertical
    { tOnTrunk: 0.08, angle: 12, length: 50, curve: 8 },
  ]

  const branches = []
  for (let i = 0; i < branchDefs.length; i++) {
    const def = branchDefs[i]
    const t = def.tOnTrunk
    const variation = s(10 + i) * 0.15

    for (const side of [-1, 1]) {
      const sx = quadAt(trunk.x1, trunk.cx, trunk.x2, 1 - t)
      const sy = quadAt(trunk.y1, trunk.cy, trunk.y2, 1 - t)

      const angleDeg = def.angle + (s(20 + i + (side > 0 ? 50 : 0)) - 0.5) * 12
      const len = def.length * (1 + variation)
      const rad = angleDeg * Math.PI / 180

      // End point — outward and upward
      const ex = sx + side * Math.cos(rad) * len
      const ey = sy - Math.sin(rad) * len

      // Control point — creates the graceful curve
      const curveFactor = def.curve * (1 + (s(30 + i) - 0.5) * 0.3)
      const cxB = sx + side * Math.cos(rad) * len * 0.55 + side * curveFactor * 0.3
      const cyB = sy - Math.sin(rad) * len * 0.7 - curveFactor

      const thickness = 2 + (t) * 3.5 // thicker near bottom

      branches.push({ sx, sy, cx: cxB, cy: cyB, ex, ey, thickness, side })
    }
  }

  // Generate exactly 30 leaf positions in concentric rings within canopy
  const canopyCx = trunk.x2
  const canopyCy = trunk.y2 - 15
  const leafPositions = generateLeafPositions(canopyCx, canopyCy, seed, branches)

  return { trunk, roots, branches, leafPositions, canopyCx, canopyCy }
}

// Distribute 30 leaf positions across canopy — no overlap guaranteed
function generateLeafPositions(cx, cy, seed, branches) {
  const s = (n) => seededRandom(seed + n)
  const positions = []

  // Place leaves along branch tips and midpoints (ensures they're ON the tree)
  for (let bi = 0; bi < branches.length; bi++) {
    const b = branches[bi]
    // Tip of branch
    positions.push({
      x: b.ex + (s(100 + bi) - 0.5) * 8,
      y: b.ey + (s(200 + bi) - 0.5) * 6,
      rotation: (s(300 + bi) - 0.5) * 80,
      scale: 0.9 + s(400 + bi) * 0.3,
    })
    // 70% along branch
    positions.push({
      x: quadAt(b.sx, b.cx, b.ex, 0.7) + (s(500 + bi) - 0.5) * 10,
      y: quadAt(b.sy, b.cy, b.ey, 0.7) + (s(600 + bi) - 0.5) * 8,
      rotation: (s(700 + bi) - 0.5) * 70,
      scale: 0.85 + s(800 + bi) * 0.35,
    })
  }

  // Fill remaining positions in canopy area using golden angle spiral
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const remaining = 30 - positions.length
  for (let i = 0; i < remaining; i++) {
    const t = (positions.length + i) / 30
    const angle = i * goldenAngle + s(900 + i) * 0.3
    const radius = 30 + t * 85 + s(1000 + i) * 15
    positions.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius * 0.65 - 10,
      rotation: (s(1100 + i) - 0.5) * 80,
      scale: 0.8 + s(1200 + i) * 0.4,
    })
  }

  return positions.slice(0, 30)
}

// Shuffle array with seed
function seededShuffle(arr, seed) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 17) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function LeafShape({ x, y, color, rotation, scale, index, isNew, isScattering, type = 'leaf' }) {
  const cls = isScattering ? 'leaf-scatter' : isNew ? 'leaf-new' : 'leaf-existing'
  const delay = isScattering ? index * 0.03 : isNew ? 0 : index * 0.03

  if (type === 'blossom') {
    return (
      <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
        <g className={cls} style={{ animationDelay: `${delay}s` }}>
          {[0, 72, 144, 216, 288].map((a, i) => (
            <ellipse key={i} cx={0} cy={-6} rx={4.5} ry={7.5} fill={color} opacity={0.8} transform={`rotate(${a})`} />
          ))}
          <circle cx={0} cy={0} r={3} fill="#FFE4B5" opacity={0.9} />
        </g>
      </g>
    )
  }

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <g className={cls} style={{ animationDelay: `${delay}s` }}>
        <path
          d="M0,-11 C5,-9 8,-3 8,1 C8,5 5,10 0,12 C-5,10 -8,5 -8,1 C-8,-3 -5,-9 0,-11Z"
          fill={color}
          opacity={0.9}
        />
        <path
          d="M0,-8 Q0.5,0 0,9 M0,-3 Q3.5,-5 5.5,-7 M0,2 Q-3.5,-0.5 -5.5,-3"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.5}
          fill="none"
        />
      </g>
    </g>
  )
}

export default function TreeCanvas({
  leaves = [], treeType = 'emotion', treeSeed = 12345,
  newLeafId = null, positionSeed = 0, isScattering = false,
}) {
  const tree = useMemo(() => generateTree(treeSeed), [treeSeed])

  // Map leaves to positions — positionSeed shuffles the assignment
  const positionedLeaves = useMemo(() => {
    const indices = positionSeed > 0
      ? seededShuffle([...Array(30).keys()], positionSeed)
      : [...Array(30).keys()]

    return leaves.map((leaf, i) => {
      const posIdx = indices[i % 30]
      const pos = tree.leafPositions[posIdx]
      return {
        ...leaf,
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        scale: pos.scale,
      }
    })
  }, [leaves, tree.leafPositions, positionSeed])

  return (
    <div className="tree-canvas-container">
      <svg viewBox="0 0 400 480" className="tree-canvas-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4A2E14" />
            <stop offset="30%" stopColor="#7A5230" />
            <stop offset="50%" stopColor="#9B6B3C" />
            <stop offset="70%" stopColor="#7A5230" />
            <stop offset="100%" stopColor="#4A2E14" />
          </linearGradient>
          <radialGradient id="groundGrad" cx="50%" cy="0%" r="50%">
            <stop offset="0%" stopColor="#1a3a1a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="canopyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a5a2a" stopOpacity={0.06 + leaves.length * 0.005} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="leafGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Canopy ambient glow */}
        {leaves.length > 2 && (
          <ellipse
            cx={tree.canopyCx} cy={tree.canopyCy + 20}
            rx={130 + leaves.length} ry={110 + leaves.length * 0.8}
            fill="url(#canopyGlow)"
          />
        )}

        {/* Ground */}
        <ellipse cx="200" cy="465" rx="130" ry="14" fill="url(#groundGrad)" />

        {/* Roots */}
        {tree.roots.map((r, i) => (
          <path
            key={i}
            d={`M ${r.x1} ${r.y1} Q ${r.cx} ${r.cy} ${r.x2} ${r.y2}`}
            stroke="url(#trunkGrad)"
            strokeWidth={3.5 - i * 0.5}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* Trunk */}
        <path
          d={`M ${tree.trunk.x1} ${tree.trunk.y1} Q ${tree.trunk.cx} ${tree.trunk.cy} ${tree.trunk.x2} ${tree.trunk.y2}`}
          stroke="url(#trunkGrad)"
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M ${tree.trunk.x1 + 2} ${tree.trunk.y1} Q ${tree.trunk.cx + 2} ${tree.trunk.cy} ${tree.trunk.x2 + 1} ${tree.trunk.y2}`}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {/* Branches */}
        <g className="tree-branches">
          {tree.branches.map((b, i) => (
            <path
              key={i}
              d={`M ${b.sx} ${b.sy} Q ${b.cx} ${b.cy} ${b.ex} ${b.ey}`}
              stroke="#6B4226"
              strokeWidth={b.thickness}
              strokeLinecap="round"
              fill="none"
            />
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
              isScattering={isScattering}
              type={treeType === 'gratitude' ? 'blossom' : 'leaf'}
            />
          ))}
        </g>

        {/* Fireflies */}
        {leaves.length > 8 && (
          <g>
            {[...Array(3)].map((_, i) => (
              <circle
                key={i}
                cx={100 + i * 100 + Math.sin(i * 3) * 30}
                cy={100 + i * 80}
                r={1.2}
                fill="#f59e0b"
                opacity={0.2}
                className="firefly"
                style={{ animationDelay: `${i * 1.5}s` }}
              />
            ))}
          </g>
        )}
      </svg>

      <div className="tree-leaf-count">{leaves.length} / 30</div>
    </div>
  )
}
