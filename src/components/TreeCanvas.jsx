import { useMemo } from 'react'
import '../styles/TreeCanvas.css'

// Seeded random for consistent tree shapes
function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Generate the tree structure from a seed
function generateTreeStructure(seed) {
  const s = (offset) => seededRandom(seed + offset)

  // Trunk control points
  const trunkSway = (s(1) - 0.5) * 15
  const trunk = {
    start: { x: 200, y: 460 },
    cp1: { x: 200 + trunkSway * 0.3, y: 380 },
    cp2: { x: 200 - trunkSway * 0.5, y: 280 },
    end: { x: 200 + trunkSway * 0.2, y: 170 },
  }

  // Generate branches
  const branches = []
  const numBranches = 6 + Math.floor(s(2) * 2) // 6-7

  for (let i = 0; i < numBranches; i++) {
    const t = 0.22 + (i / numBranches) * 0.6 // position along trunk (22% - 82%)
    const side = i % 2 === 0 ? -1 : 1

    // Point on trunk at parameter t
    const tt = t
    const mt = 1 - tt
    const startX = mt*mt*mt * trunk.start.x + 3*mt*mt*tt * trunk.cp1.x + 3*mt*tt*tt * trunk.cp2.x + tt*tt*tt * trunk.end.x
    const startY = mt*mt*mt * trunk.start.y + 3*mt*mt*tt * trunk.cp1.y + 3*mt*tt*tt * trunk.cp2.y + tt*tt*tt * trunk.end.y

    const angle = (35 + s(10 + i) * 35) * side // 35-70 degrees
    const length = 50 + s(20 + i) * 70 // 50-120px
    const rad = ((90 - angle) * Math.PI) / 180

    const endX = startX + Math.cos(rad) * length * (side === -1 ? -1 : 1)
    const endY = startY - Math.sin(rad) * length * 0.6

    const cpX = startX + (endX - startX) * 0.5 + s(30 + i) * 15 * side
    const cpY = startY + (endY - startY) * 0.4 - s(40 + i) * 20

    // Sub-branch
    const subT = 0.5 + s(50 + i) * 0.3
    const subStartX = startX + (endX - startX) * subT
    const subStartY = startY + (endY - startY) * subT
    const subAngle = angle * 0.7 + s(60 + i) * 20
    const subLength = length * (0.3 + s(70 + i) * 0.3)
    const subRad = ((90 - subAngle) * Math.PI) / 180
    const subEndX = subStartX + Math.cos(subRad) * subLength * (side === -1 ? -1 : 1)
    const subEndY = subStartY - Math.sin(subRad) * subLength * 0.5

    branches.push({
      path: `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`,
      end: { x: endX, y: endY },
      thickness: 3 + (1 - t) * 4, // thicker near base
      subBranch: {
        path: `M ${subStartX} ${subStartY} Q ${(subStartX + subEndX) / 2} ${subStartY + (subEndY - subStartY) * 0.3} ${subEndX} ${subEndY}`,
        end: { x: subEndX, y: subEndY },
        thickness: 1.5 + (1 - t) * 2,
      },
    })
  }

  // Generate leaf anchor positions (along branches and sub-branches)
  const leafPositions = []
  branches.forEach((branch, bi) => {
    // 2-3 positions per branch
    for (let j = 0; j < 3; j++) {
      const t = 0.4 + j * 0.25 + s(100 + bi * 10 + j) * 0.1
      const bStartX = parseFloat(branch.path.match(/M ([\d.]+)/)?.[1] || 0)
      const bStartY = parseFloat(branch.path.match(/M [\d.]+ ([\d.]+)/)?.[1] || 0)
      const x = bStartX + (branch.end.x - bStartX) * t + (s(200 + bi * 10 + j) - 0.5) * 10
      const y = bStartY + (branch.end.y - bStartY) * t + (s(300 + bi * 10 + j) - 0.5) * 8

      leafPositions.push({
        x, y,
        rotation: (s(400 + bi * 10 + j) - 0.5) * 60,
        scale: 0.8 + s(500 + bi * 10 + j) * 0.4,
      })
    }

    // 1-2 on sub-branch
    for (let j = 0; j < 2; j++) {
      const t = 0.5 + j * 0.3
      const subStart = branch.subBranch.path.match(/M ([\d.]+) ([\d.]+)/)
      const sx = parseFloat(subStart?.[1] || 0)
      const sy = parseFloat(subStart?.[2] || 0)
      const x = sx + (branch.subBranch.end.x - sx) * t + (s(600 + bi * 10 + j) - 0.5) * 8
      const y = sy + (branch.subBranch.end.y - sy) * t + (s(700 + bi * 10 + j) - 0.5) * 6

      leafPositions.push({
        x, y,
        rotation: (s(800 + bi * 10 + j) - 0.5) * 50,
        scale: 0.7 + s(900 + bi * 10 + j) * 0.3,
      })
    }
  })

  // Top crown positions
  const crownCenterX = trunk.end.x
  const crownCenterY = trunk.end.y - 10
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + s(1000 + i)
    const dist = 15 + s(1100 + i) * 25
    leafPositions.push({
      x: crownCenterX + Math.cos(angle) * dist,
      y: crownCenterY + Math.sin(angle) * dist * 0.6 - 10,
      rotation: (s(1200 + i) - 0.5) * 40,
      scale: 0.85 + s(1300 + i) * 0.3,
    })
  }

  return { trunk, branches, leafPositions }
}

// Leaf SVG shape
function LeafShape({ x, y, color, rotation, scale, index, isNew, type = 'leaf' }) {
  const animDelay = isNew ? 0 : index * 0.05

  if (type === 'blossom') {
    return (
      <g
        transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}
        className={isNew ? 'leaf-new' : 'leaf-existing'}
        style={{ animationDelay: `${animDelay}s` }}
      >
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <ellipse
            key={i}
            cx={0}
            cy={-5}
            rx={3.5}
            ry={6}
            fill={color}
            opacity={0.85}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx={0} cy={0} r={2.5} fill="#FFE4B5" opacity={0.9} />
      </g>
    )
  }

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}
      className={isNew ? 'leaf-new' : 'leaf-existing'}
      style={{ animationDelay: `${animDelay}s` }}
    >
      <path
        d="M0,-9 C3.5,-7.5 5.5,-3 5.5,0 C5.5,3.5 3.5,7.5 0,9.5 C-3.5,7.5 -5.5,3.5 -5.5,0 C-5.5,-3 -3.5,-7.5 0,-9Z"
        fill={color}
        opacity={0.88}
      />
      {/* Leaf vein */}
      <line x1={0} y1={-6} x2={0} y2={7} stroke={color} strokeWidth={0.5} opacity={0.4} />
      <line x1={0} y1={-2} x2={3} y2={-5} stroke={color} strokeWidth={0.3} opacity={0.3} />
      <line x1={0} y1={1} x2={-3} y2={-2} stroke={color} strokeWidth={0.3} opacity={0.3} />
    </g>
  )
}

export default function TreeCanvas({ leaves = [], treeType = 'emotion', treeSeed = 12345, newLeafId = null }) {
  const tree = useMemo(() => generateTreeStructure(treeSeed), [treeSeed])

  // Map leaves to positions
  const positionedLeaves = leaves.map((leaf, i) => {
    const pos = tree.leafPositions[i % tree.leafPositions.length]
    // Add slight offset for leaves sharing positions
    const offset = Math.floor(i / tree.leafPositions.length)
    return {
      ...leaf,
      x: pos.x + offset * 5,
      y: pos.y + offset * 3,
      rotation: pos.rotation + offset * 15,
      scale: pos.scale * (1 - offset * 0.1),
    }
  })

  return (
    <div className="tree-canvas-container">
      <svg
        viewBox="0 0 400 500"
        className="tree-canvas-svg"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* Trunk gradient */}
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5C3A1E" />
            <stop offset="30%" stopColor="#8B5E3C" />
            <stop offset="70%" stopColor="#8B5E3C" />
            <stop offset="100%" stopColor="#6B4226" />
          </linearGradient>

          {/* Ground gradient */}
          <radialGradient id="groundGrad" cx="50%" cy="0%" r="60%">
            <stop offset="0%" stopColor="#1a3a1a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Glow filter for new leaves */}
          <filter id="leafGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ambient */}
        <rect width="400" height="500" fill="transparent" />

        {/* Ground */}
        <ellipse cx="200" cy="470" rx="160" ry="20" fill="url(#groundGrad)" />

        {/* Trunk */}
        <path
          d={`M ${tree.trunk.start.x} ${tree.trunk.start.y} C ${tree.trunk.cp1.x} ${tree.trunk.cp1.y} ${tree.trunk.cp2.x} ${tree.trunk.cp2.y} ${tree.trunk.end.x} ${tree.trunk.end.y}`}
          stroke="url(#trunkGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          className="tree-trunk"
        />
        {/* Trunk highlight */}
        <path
          d={`M ${tree.trunk.start.x + 2} ${tree.trunk.start.y} C ${tree.trunk.cp1.x + 2} ${tree.trunk.cp1.y} ${tree.trunk.cp2.x + 1} ${tree.trunk.cp2.y} ${tree.trunk.end.x + 1} ${tree.trunk.end.y}`}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Branches */}
        <g className="tree-branches">
          {tree.branches.map((branch, i) => (
            <g key={i}>
              <path
                d={branch.path}
                stroke="#7A5230"
                strokeWidth={branch.thickness}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={branch.subBranch.path}
                stroke="#8B6340"
                strokeWidth={branch.subBranch.thickness}
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

        {/* Fireflies / ambient particles when tree has leaves */}
        {leaves.length > 5 && (
          <g className="ambient-particles">
            {[...Array(3)].map((_, i) => (
              <circle
                key={i}
                cx={100 + i * 100 + Math.sin(i * 2) * 30}
                cy={150 + i * 60}
                r={1.5}
                fill="#f59e0b"
                opacity={0.3}
                className="firefly"
                style={{ animationDelay: `${i * 1.5}s` }}
              />
            ))}
          </g>
        )}
      </svg>

      {/* Leaf count */}
      <div className="tree-leaf-count">
        {leaves.length} / 30
      </div>
    </div>
  )
}
