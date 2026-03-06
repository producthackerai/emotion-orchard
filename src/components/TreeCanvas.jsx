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

  // Branches — clock face layout, top branches shortened for denser canopy
  const defs = [
    { sy: 388, ex: 78,  ey: 288, cx: 128, cy: 368, t: 4.5 },  // 7 o'clock
    { sy: 356, ex: 55,  ey: 235, cx: 108, cy: 322, t: 4.0 },  // 8 o'clock
    { sy: 325, ex: 60,  ey: 195, cx: 118, cy: 278, t: 3.5 },  // 9 o'clock
    { sy: 295, ex: 85,  ey: 155, cx: 135, cy: 245, t: 3.0 },  // 10 o'clock (shortened)
    { sy: 270, ex: 135, ey: 115, cx: 165, cy: 205, t: 2.7 },  // 11 o'clock (shortened)
    { sy: 388, ex: 322, ey: 288, cx: 272, cy: 368, t: 4.5 },  // 5 o'clock
    { sy: 356, ex: 345, ey: 235, cx: 292, cy: 322, t: 4.0 },  // 4 o'clock
    { sy: 325, ex: 340, ey: 195, cx: 282, cy: 278, t: 3.5 },  // 3 o'clock
    { sy: 295, ex: 315, ey: 155, cx: 265, cy: 245, t: 3.0 },  // 2 o'clock (shortened)
    { sy: 270, ex: 265, ey: 115, cx: 235, cy: 205, t: 2.7 },  // 1 o'clock (shortened)
    { sy: 248, ex: 200, ey: 95,  cx: 200, cy: 175, t: 2.5 },  // 12 o'clock (shortened)
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
    x = Math.max(48, Math.min(352, x))
    y = Math.max(80, Math.min(318, y))

    let fx = x, fy = y
    for (const p of placed) {
      const dx = fx - p.x, dy = fy - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 14) {
        const push = (14 - dist) / 2
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

  // Layer 1: branch tips
  branches.forEach((b, i) => {
    addPos(b.ex + (s(100+i)-0.5)*14, b.ey + (s(200+i)-0.5)*10, 300+i*10)
  })
  // Layer 2: 60% along branches
  branches.forEach((b, i) => {
    addPos(
      quadAt(b.sx, b.cx, b.ex, 0.6) + (s(400+i)-0.5)*16,
      quadAt(b.sy, b.cy, b.ey, 0.6) + (s(500+i)-0.5)*14,
      600+i*10,
    )
  })
  // Layer 3: 35% along branches
  branches.forEach((b, i) => {
    addPos(
      quadAt(b.sx, b.cx, b.ex, 0.35) + (s(700+i)-0.5)*20,
      quadAt(b.sy, b.cy, b.ey, 0.35) + (s(750+i)-0.5)*18,
      770+i*10,
    )
  })
  // Layer 4: 82% along branches
  branches.forEach((b, i) => {
    addPos(
      quadAt(b.sx, b.cx, b.ex, 0.82) + (s(850+i)-0.5)*15,
      quadAt(b.sy, b.cy, b.ey, 0.82) + (s(870+i)-0.5)*12,
      890+i*10,
    )
  })

  // Fill remaining with canopy scatter
  const canopyCy = 200
  const remaining = 60 - positions.length
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < remaining; i++) {
    const angle = i * goldenAngle + s(1000+i) * 0.3
    const r = 25 + (i / Math.max(remaining, 1)) * 100 + s(1100+i) * 14
    addPos(
      cx + Math.cos(angle) * r,
      canopyCy + Math.sin(angle) * r * 0.65,
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

// ── Magical ambient elements ──

function Fireflies({ seed, count }) {
  const flies = useMemo(() => {
    const s = (n) => seededRandom(seed + n)
    return Array.from({ length: count }, (_, i) => ({
      cx: 60 + s(i * 3) * 280,
      cy: 80 + s(i * 3 + 1) * 250,
      r: 1 + s(i * 3 + 2) * 1.2,
      delay: s(i * 5) * 6,
      dur: 3 + s(i * 7) * 4,
      dx: 15 + s(i * 9) * 25,
      dy: 10 + s(i * 11) * 20,
    }))
  }, [seed, count])

  return (
    <g className="fireflies-group">
      {flies.map((f, i) => (
        <circle key={i} cx={f.cx} cy={f.cy} r={f.r}
          fill="#f5d06b" className="firefly-dot"
          style={{
            '--fly-dx': `${f.dx}px`,
            '--fly-dy': `${f.dy}px`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.dur}s`,
          }}
        />
      ))}
    </g>
  )
}

function DappledLight({ seed }) {
  const spots = useMemo(() => {
    const s = (n) => seededRandom(seed + n + 5000)
    return Array.from({ length: 6 }, (_, i) => ({
      cx: 80 + s(i * 4) * 240,
      cy: 100 + s(i * 4 + 1) * 200,
      rx: 12 + s(i * 4 + 2) * 18,
      ry: 8 + s(i * 4 + 3) * 14,
      delay: s(i * 6) * 8,
      dur: 5 + s(i * 8) * 6,
    }))
  }, [seed])

  return (
    <g className="dappled-light">
      {spots.map((sp, i) => (
        <ellipse key={i} cx={sp.cx} cy={sp.cy} rx={sp.rx} ry={sp.ry}
          fill="rgba(255,248,220,0.06)" className="light-spot"
          style={{ animationDelay: `${sp.delay}s`, animationDuration: `${sp.dur}s` }}
        />
      ))}
    </g>
  )
}

function FallingLeaf({ seed }) {
  const s = (n) => seededRandom(seed + n + 9000)
  const startX = 100 + s(0) * 200
  const color = BASE_GREENS[Math.floor(s(1) * BASE_GREENS.length)]
  const dur = 8 + s(2) * 6

  return (
    <g className="falling-leaf" style={{ animationDuration: `${dur}s` }}>
      <path
        d="M0,-5 C2.5,-4 4,-1.5 4,0.5 C4,3 2.5,5 0,6 C-2.5,5 -4,3 -4,0.5 C-4,-1.5 -2.5,-4 0,-5Z"
        fill={color} opacity={0.5}
        transform={`translate(${startX}, -10)`}
        style={{ '--fall-x': `${startX}px` }}
      />
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

  // TRUE shuffle: all 60 positions get shuffled together, then
  // base greens take the first 30, emotion leaves take the rest
  const allPositions = useMemo(() => {
    if (positionSeed > 0) {
      return seededShuffle(tree.leafPositions, positionSeed)
    }
    return tree.leafPositions
  }, [tree.leafPositions, positionSeed])

  const baseLeaves = useMemo(() => {
    const baseSlots = allPositions.slice(0, 30)
    return baseSlots.map((pos, i) => ({
      x: pos.x, y: pos.y,
      rotation: pos.rotation,
      scale: pos.scale * 0.95,
      color: BASE_GREENS[i % BASE_GREENS.length],
    }))
  }, [allPositions])

  const positionedLeaves = useMemo(() => {
    const emotionSlots = allPositions.slice(30, 60)
    return leaves.map((leaf, i) => {
      const pos = emotionSlots[i % 30]
      return { ...leaf, x: pos.x, y: pos.y, rotation: pos.rotation, scale: pos.scale }
    })
  }, [leaves, allPositions])

  const selected = selectedIdx !== null ? positionedLeaves[selectedIdx] : null

  // Tooltip position — above the leaf, clamped inside viewBox
  let tipX = 0, tipY = 0
  if (selected) {
    tipX = Math.max(5, Math.min(selected.x - 80, 235))
    tipY = selected.y - 55
    if (tipY < 5) tipY = selected.y + 25
  }

  const leafCount = leaves.length
  const fireflyCount = leafCount >= 20 ? 8 : leafCount >= 12 ? 5 : leafCount >= 5 ? 3 : 0

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
            <stop offset="0%" stopColor="#2a5a2a" stopOpacity={0.06 + leafCount * 0.006} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="warmGlow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#fff8dc" stopOpacity={0.03 + leafCount * 0.002} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="leafGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Warm ambient glow behind canopy */}
        <ellipse cx={200} cy={180} rx={160} ry={140} fill="url(#warmGlow)" />

        {/* Canopy glow */}
        <ellipse cx={200} cy={190} rx={150 + leafCount * 1.2} ry={130 + leafCount * 0.8} fill="url(#canopyGlow)" />

        {/* Dappled sunlight through leaves */}
        {leafCount > 3 && <DappledLight seed={treeSeed} />}

        {/* Ground shadow */}
        <ellipse cx="200" cy="465" rx="120" ry="12" fill="url(#groundGrad)" />

        {/* Ground grass tufts */}
        <g opacity="0.25">
          <path d="M130,468 Q128,458 132,448" stroke="#2d5a2d" strokeWidth="1.2" fill="none" />
          <path d="M135,470 Q134,460 138,452" stroke="#2d5a2d" strokeWidth="1" fill="none" />
          <path d="M265,469 Q267,459 263,449" stroke="#2d5a2d" strokeWidth="1.2" fill="none" />
          <path d="M260,471 Q261,461 257,453" stroke="#2d5a2d" strokeWidth="1" fill="none" />
        </g>

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
              {/* Hover (desktop) + tap (mobile) target */}
              <circle
                cx={leaf.x} cy={leaf.y} r={16} fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerEnter={(e) => { if (e.pointerType !== 'touch') setSelectedIdx(i) }}
                onPointerLeave={(e) => { if (e.pointerType !== 'touch') setSelectedIdx(null) }}
                onClick={(e) => { e.stopPropagation(); setSelectedIdx(i === selectedIdx ? null : i) }}
              />
            </g>
          ))}
        </g>

        {/* Fireflies — more appear as tree grows */}
        {fireflyCount > 0 && <Fireflies seed={treeSeed} count={fireflyCount} />}

        {/* Falling leaf — gentle drift, appears on fuller trees */}
        {leafCount >= 15 && <FallingLeaf seed={treeSeed + positionSeed} />}

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
