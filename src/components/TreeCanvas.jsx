import { useMemo, useState } from 'react'
import '../styles/TreeCanvas.css'

function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function quadAt(p0, p1, p2, t) {
  const mt = 1 - t
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2
}

// Dark greens for base foliage — varied for natural look
const BASE_GREENS = [
  '#1a4a1a', '#1f5220', '#245a26', '#1d4d1d', '#22552a',
  '#2a5e2a', '#1b4e1f', '#205524', '#264f26', '#1e5222',
  '#2d6030', '#1a4420', '#234e28', '#1c5025', '#265830',
]

function generateTree(seed) {
  const s = (n) => seededRandom(seed + n)
  const cx = 200

  const sway = (s(1) - 0.5) * 5
  const trunk = {
    x1: cx, y1: 460,
    cx: cx + sway, cy: 345,
    x2: cx + sway * 0.2, y2: 228,
  }

  const roots = [
    { x1: cx, y1: 460, cx: cx - 28, cy: 464, x2: cx - 48, y2: 472 },
    { x1: cx, y1: 460, cx: cx + 28, cy: 464, x2: cx + 48, y2: 472 },
    { x1: cx, y1: 460, cx: cx - 13, cy: 466, x2: cx - 26, y2: 476 },
    { x1: cx, y1: 460, cx: cx + 13, cy: 466, x2: cx + 26, y2: 476 },
  ]

  const v = (n) => (s(n) - 0.5) * 5

  const defs = [
    { sy: 388, ex: 78,  ey: 288, cx: 128, cy: 368, t: 4.5 },
    { sy: 356, ex: 55,  ey: 235, cx: 108, cy: 322, t: 4.0 },
    { sy: 325, ex: 52,  ey: 185, cx: 112, cy: 278, t: 3.5 },
    { sy: 295, ex: 68,  ey: 128, cx: 122, cy: 236, t: 3.0 },
    { sy: 266, ex: 115, ey: 78,  cx: 155, cy: 192, t: 2.7 },
    { sy: 388, ex: 322, ey: 288, cx: 272, cy: 368, t: 4.5 },
    { sy: 356, ex: 345, ey: 235, cx: 292, cy: 322, t: 4.0 },
    { sy: 325, ex: 348, ey: 185, cx: 288, cy: 278, t: 3.5 },
    { sy: 295, ex: 332, ey: 128, cx: 278, cy: 236, t: 3.0 },
    { sy: 266, ex: 285, ey: 78,  cx: 245, cy: 192, t: 2.7 },
    { sy: 242, ex: 200, ey: 62,  cx: 200, cy: 158, t: 2.5 },
  ]

  const branches = defs.map((b, i) => ({
    sx: cx + v(10 + i) * 0.15,
    sy: b.sy + v(20 + i) * 0.2,
    cx: b.cx + v(30 + i) * 0.7,
    cy: b.cy + v(40 + i) * 0.7,
    ex: b.ex + v(50 + i) * 0.8,
    ey: b.ey + v(60 + i) * 0.6,
    thickness: b.t,
  }))

  const leafPositions = computeLeafPositions(cx, branches, seed)
  return { trunk, roots, branches, leafPositions }
}

function computeLeafPositions(cx, branches, seed) {
  const s = (n) => seededRandom(seed + n)
  const positions = []
  const placed = []

  function addPos(x, y, seedOffset) {
    x = Math.max(42, Math.min(358, x))
    y = Math.max(48, Math.min(318, y))

    let fx = x, fy = y
    for (const p of placed) {
      const dx = fx - p.x, dy = fy - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 15) {
        const push = (15 - dist) / 2
        fx += (dx / (dist || 1)) * push
        fy += (dy / (dist || 1)) * push
      }
    }
    const pos = {
      x: fx, y: fy,
      rotation: (s(seedOffset) - 0.5) * 75,
      scale: 0.9 + s(seedOffset + 1) * 0.5,
    }
    placed.push(pos)
    positions.push(pos)
  }

  branches.forEach((b, i) => {
    addPos(b.ex + (s(100+i)-0.5)*14, b.ey + (s(200+i)-0.5)*10, 300+i*10)
  })
  branches.forEach((b, i) => {
    addPos(
      quadAt(b.sx, b.cx, b.ex, 0.6) + (s(400+i)-0.5)*16,
      quadAt(b.sy, b.cy, b.ey, 0.6) + (s(500+i)-0.5)*14,
      600+i*10,
    )
  })
  branches.forEach((b, i) => {
    addPos(
      quadAt(b.sx, b.cx, b.ex, 0.35) + (s(700+i)-0.5)*20,
      quadAt(b.sy, b.cy, b.ey, 0.35) + (s(750+i)-0.5)*18,
      770+i*10,
    )
  })
  branches.forEach((b, i) => {
    addPos(
      quadAt(b.sx, b.cx, b.ex, 0.82) + (s(850+i)-0.5)*15,
      quadAt(b.sy, b.cy, b.ey, 0.82) + (s(870+i)-0.5)*12,
      890+i*10,
    )
  })

  const canopyCy = 185
  const remaining = 60 - positions.length
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < remaining; i++) {
    const angle = i * goldenAngle + s(1000+i) * 0.3
    const r = 30 + (i / Math.max(remaining, 1)) * 115 + s(1100+i) * 14
    addPos(
      cx + Math.cos(angle) * r,
      canopyCy + Math.sin(angle) * r * 0.72,
      1200+i*10,
    )
  }

  return positions.slice(0, 60)
}

function seededShuffle(arr, seed) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 17) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ── Leaf / Blossom shapes ──

function LeafShape({ x, y, color, rotation, scale, index, isNew, isScattering, type = 'leaf', isBase = false }) {
  const cls = isScattering ? 'leaf-scatter' : isNew ? 'leaf-new' : 'leaf-existing'
  const delay = isScattering ? index * 0.03 : isNew ? 0 : index * 0.02

  if (type === 'blossom') {
    return (
      <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
        <g className={cls} style={{ animationDelay: `${delay}s` }}>
          {[0, 72, 144, 216, 288].map((a, i) => (
            <ellipse key={i} cx={0} cy={-8} rx={6} ry={10} fill={color} opacity={0.8} transform={`rotate(${a})`} />
          ))}
          <circle cx={0} cy={0} r={4} fill="#FFE4B5" opacity={0.9} />
        </g>
      </g>
    )
  }

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <g className={cls} style={{ animationDelay: `${delay}s` }}>
        <path
          d="M0,-15 C7,-12 11,-4 11,1 C11,7 7,14 0,16 C-7,14 -11,7 -11,1 C-11,-4 -7,-12 0,-15Z"
          fill={color}
          opacity={isBase ? 0.82 : 0.92}
        />
        <path
          d="M0,-11 Q1,0 0,12 M0,-4 Q5,-7 7,-9 M0,3 Q-5,-1 -7,-4"
          stroke={isBase ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}
          strokeWidth={0.5}
          fill="none"
        />
      </g>
    </g>
  )
}

// ── Main component ──

export default function TreeCanvas({
  leaves = [], treeType = 'emotion', treeSeed = 12345,
  newLeafId = null, positionSeed = 0, isScattering = false,
}) {
  const tree = useMemo(() => generateTree(treeSeed), [treeSeed])
  const [selectedIdx, setSelectedIdx] = useState(null)

  const baseLeaves = useMemo(() => {
    const baseSlots = tree.leafPositions.slice(0, 30)
    const indices = positionSeed > 0
      ? seededShuffle([...Array(30).keys()], positionSeed + 7777)
      : [...Array(30).keys()]

    return indices.map((posIdx, i) => {
      const pos = baseSlots[posIdx]
      return {
        x: pos.x, y: pos.y,
        rotation: pos.rotation,
        scale: pos.scale * 0.95,
        color: BASE_GREENS[i % BASE_GREENS.length],
      }
    })
  }, [tree.leafPositions, positionSeed])

  const positionedLeaves = useMemo(() => {
    const emotionSlots = tree.leafPositions.slice(30, 60)
    const indices = positionSeed > 0
      ? seededShuffle([...Array(30).keys()], positionSeed)
      : [...Array(30).keys()]

    return leaves.map((leaf, i) => {
      const posIdx = indices[i % 30]
      const pos = emotionSlots[posIdx]
      return { ...leaf, x: pos.x, y: pos.y, rotation: pos.rotation, scale: pos.scale }
    })
  }, [leaves, tree.leafPositions, positionSeed])

  const selected = selectedIdx !== null ? positionedLeaves[selectedIdx] : null

  // Tooltip position — above the leaf, clamped inside viewBox
  let tipX = 0, tipY = 0
  if (selected) {
    tipX = Math.max(5, Math.min(selected.x - 80, 235))
    tipY = selected.y - 55
    if (tipY < 5) tipY = selected.y + 25
  }

  return (
    <div className="tree-canvas-container">
      <svg
        viewBox="0 0 400 480"
        className="tree-canvas-svg"
        preserveAspectRatio="xMidYMid meet"
        onClick={() => setSelectedIdx(null)}
      >
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

        {/* Canopy glow */}
        <ellipse cx={200} cy={185} rx={155 + leaves.length * 1.2} ry={135 + leaves.length * 0.8} fill="url(#canopyGlow)" />

        {/* Ground shadow */}
        <ellipse cx="200" cy="465" rx="120" ry="12" fill="url(#groundGrad)" />

        {/* Roots */}
        {tree.roots.map((r, i) => (
          <path key={i} d={`M ${r.x1} ${r.y1} Q ${r.cx} ${r.cy} ${r.x2} ${r.y2}`}
            stroke="url(#trunkGrad)" strokeWidth={3 - i * 0.3} strokeLinecap="round" fill="none" />
        ))}

        {/* Trunk */}
        <path
          d={`M ${tree.trunk.x1} ${tree.trunk.y1} Q ${tree.trunk.cx} ${tree.trunk.cy} ${tree.trunk.x2} ${tree.trunk.y2}`}
          stroke="url(#trunkGrad)" strokeWidth={14} strokeLinecap="round" fill="none"
        />
        <path
          d={`M ${tree.trunk.x1 + 2} ${tree.trunk.y1} Q ${tree.trunk.cx + 2} ${tree.trunk.cy} ${tree.trunk.x2 + 1} ${tree.trunk.y2}`}
          stroke="rgba(255,255,255,0.04)" strokeWidth={3} strokeLinecap="round" fill="none"
        />

        {/* Branches */}
        <g className="tree-branches">
          {tree.branches.map((b, i) => (
            <path key={i}
              d={`M ${b.sx} ${b.sy} Q ${b.cx} ${b.cy} ${b.ex} ${b.ey}`}
              stroke="#6B4226" strokeWidth={b.thickness} strokeLinecap="round" fill="none"
            />
          ))}
        </g>

        {/* Base foliage */}
        <g className="tree-leaves-base">
          {baseLeaves.map((leaf, i) => (
            <LeafShape key={`base-${i}`}
              x={leaf.x} y={leaf.y} color={leaf.color}
              rotation={leaf.rotation} scale={leaf.scale} index={i}
              isNew={false} isScattering={isScattering}
              type="leaf" isBase
            />
          ))}
        </g>

        {/* Emotion leaves — tappable */}
        <g className="tree-leaves">
          {positionedLeaves.map((leaf, i) => (
            <g key={leaf.id || i}>
              <LeafShape
                x={leaf.x} y={leaf.y} color={leaf.color}
                rotation={leaf.rotation} scale={leaf.scale} index={i}
                isNew={leaf.id === newLeafId} isScattering={isScattering}
                type={treeType === 'gratitude' ? 'blossom' : 'leaf'}
              />
              {/* Invisible tap target */}
              <circle
                cx={leaf.x} cy={leaf.y} r={16} fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setSelectedIdx(i === selectedIdx ? null : i) }}
              />
            </g>
          ))}
        </g>

        {/* Fireflies */}
        {leaves.length > 8 && (
          <g>
            {[...Array(3)].map((_, i) => (
              <circle key={i} cx={90 + i * 110} cy={120 + i * 70} r={1.2}
                fill="#f59e0b" opacity={0.2} className="firefly"
                style={{ animationDelay: `${i * 1.5}s` }} />
            ))}
          </g>
        )}

        {/* Leaf detail tooltip */}
        {selected && (
          <foreignObject
            x={tipX} y={tipY} width={160} height={50}
            style={{ overflow: 'visible', pointerEvents: 'none' }}
          >
            <div className="leaf-tooltip">
              <div className="leaf-tooltip-dot" style={{ background: selected.color }} />
              <div className="leaf-tooltip-body">
                {selected.emotion && (
                  <span className="leaf-tooltip-emotion">{selected.emotion}</span>
                )}
                {selected.person_name && (
                  <span className="leaf-tooltip-person">To {selected.person_name}</span>
                )}
                {selected.note && (
                  <span className="leaf-tooltip-note">{selected.note}</span>
                )}
              </div>
            </div>
          </foreignObject>
        )}
      </svg>

      <div className="tree-leaf-count">{leaves.length} / 30</div>
    </div>
  )
}
