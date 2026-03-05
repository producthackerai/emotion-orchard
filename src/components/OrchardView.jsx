import { useMemo } from 'react'
import '../styles/OrchardView.css'

function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const BASE_GREENS = [
  '#1a4a1a', '#1f5220', '#245a26', '#1d4d1d', '#22552a',
  '#2a5e2a', '#1b4e1f', '#205524', '#264f26', '#1e5222',
  '#2d6030', '#1a4420', '#234e28', '#1c5025', '#265830',
]

// Mini branch geometry matching the SVG branches below
const MINI_BRANCHES = [
  { sx: 40, sy: 76, ex: 18, ey: 60 },
  { sx: 40, sy: 76, ex: 62, ey: 60 },
  { sx: 40, sy: 66, ex: 15, ey: 44 },
  { sx: 40, sy: 66, ex: 65, ey: 44 },
  { sx: 40, sy: 57, ex: 22, ey: 32 },
  { sx: 40, sy: 57, ex: 58, ey: 32 },
  { sx: 40, sy: 50, ex: 32, ey: 24 },
  { sx: 40, sy: 50, ex: 48, ey: 24 },
  { sx: 40, sy: 44, ex: 40, ey: 20 },
]

function generateMiniPositions(seed, total) {
  const s = (n) => seededRandom(seed + n)
  const positions = []

  // Place leaves along branches at multiple points
  const tValues = [1.0, 0.65, 0.35, 0.85, 0.15]
  let si = 0
  for (const t of tValues) {
    for (const b of MINI_BRANCHES) {
      if (positions.length >= total) break
      const jitter = 5
      positions.push({
        x: b.sx + t * (b.ex - b.sx) + (s(si) - 0.5) * jitter,
        y: b.sy + t * (b.ey - b.sy) + (s(si + 1) - 0.5) * jitter,
      })
      si += 2
    }
  }

  // Fill any remaining with canopy scatter
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = positions.length; i < total; i++) {
    const angle = i * goldenAngle + s(500 + i) * 0.4
    const r = 5 + (i / total) * 20 + s(600 + i) * 4
    positions.push({
      x: 40 + Math.cos(angle) * r,
      y: 46 + Math.sin(angle) * r * 0.85,
    })
  }

  return positions.slice(0, total)
}

function MiniTreeSvg({ seed, leafCount, leaves = [], type = 'emotion' }) {
  const total = 30 + leafCount

  const positions = useMemo(
    () => generateMiniPositions(seed, total),
    [seed, total],
  )

  return (
    <svg viewBox="0 0 80 95" className="mini-tree-svg">
      {/* Ground */}
      <ellipse cx="40" cy="90" rx="14" ry="3" fill="var(--color-grass)" opacity="0.3" />

      {/* Trunk */}
      <line x1="40" y1="88" x2="40" y2="44" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" />

      {/* Branches */}
      <line x1="40" y1="76" x2="18" y2="60" stroke="#7A5230" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="40" y1="76" x2="62" y2="60" stroke="#7A5230" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="40" y1="66" x2="15" y2="44" stroke="#7A5230" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="40" y1="66" x2="65" y2="44" stroke="#7A5230" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="40" y1="57" x2="22" y2="32" stroke="#7A5230" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="40" y1="57" x2="58" y2="32" stroke="#7A5230" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="40" y1="50" x2="32" y2="24" stroke="#7A5230" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="40" y1="50" x2="48" y2="24" stroke="#7A5230" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="40" y1="44" x2="40" y2="20" stroke="#7A5230" strokeWidth="0.8" strokeLinecap="round" />

      {/* Leaf dots */}
      {positions.map((pos, i) => {
        let color
        if (i < 30) {
          color = BASE_GREENS[i % BASE_GREENS.length]
        } else {
          const li = i - 30
          if (leaves[li]?.color) {
            color = leaves[li].color
          } else if (type === 'gratitude') {
            color = `hsl(${340 + seededRandom(seed + i) * 30}, 80%, 78%)`
          } else {
            color = `hsl(${seededRandom(seed + i * 37) * 360}, 70%, 55%)`
          }
        }
        return (
          <circle key={i} cx={pos.x} cy={pos.y} r={2.3}
            fill={color} opacity={i < 30 ? 0.6 : 0.88}
          />
        )
      })}
    </svg>
  )
}

function MiniTree({ tree, leafCount, leaves, onClick }) {
  const seed = tree.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  return (
    <button className="orchard-tree-card" onClick={() => onClick(tree)}>
      <div className="mini-tree-container">
        <MiniTreeSvg
          seed={seed}
          leafCount={leafCount}
          leaves={leaves}
          type={tree.type}
        />
      </div>

      <div className="mini-tree-info">
        <span className="mini-tree-name">{tree.name}</span>
        <span className="mini-tree-meta">
          {leafCount} {tree.type === 'gratitude' ? 'blossoms' : 'leaves'}
        </span>
        <span className="mini-tree-date">
          {new Date(tree.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </button>
  )
}

export default function OrchardView({ trees, treeLeaveCounts, allLeaves = [], onSelectTree, onCreateTree }) {
  return (
    <div className="orchard-view">
      <div className="orchard-header">
        <h2 className="orchard-title">Your Orchard</h2>
        <p className="orchard-subtitle">{trees.length} tree{trees.length !== 1 ? 's' : ''} growing</p>
      </div>

      <div className="orchard-grid">
        {/* New tree — shows base foliage preview */}
        <button className="new-tree-card" onClick={() => onCreateTree('emotion')}>
          <div className="mini-tree-container">
            <MiniTreeSvg seed={42} leafCount={0} type="emotion" />
          </div>
          <span className="new-tree-label">New Emotion Tree</span>
        </button>

        <button className="new-tree-card new-tree-gratitude" onClick={() => onCreateTree('gratitude')}>
          <div className="mini-tree-container">
            <MiniTreeSvg seed={99} leafCount={0} type="gratitude" />
          </div>
          <span className="new-tree-label">New Gratitude Tree</span>
        </button>

        {/* Existing trees */}
        {trees.map((tree) => (
          <MiniTree
            key={tree.id}
            tree={tree}
            leafCount={treeLeaveCounts[tree.id] || 0}
            leaves={allLeaves.filter(l => l.tree_id === tree.id)}
            onClick={onSelectTree}
          />
        ))}
      </div>

      {trees.length === 0 && (
        <div className="orchard-empty">
          <p className="orchard-empty-title">Plant your first tree</p>
          <p className="orchard-empty-text">
            Tap an emotion to grow a leaf. Watch your feelings bloom into something beautiful.
          </p>
        </div>
      )}
    </div>
  )
}
