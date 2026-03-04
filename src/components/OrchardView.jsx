import { Plus, TreePine, Flower2 } from 'lucide-react'
import '../styles/OrchardView.css'

function MiniTree({ tree, leafCount, onClick }) {
  // Generate tiny SVG preview
  const seed = tree.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const fullness = leafCount / 30

  return (
    <button className="orchard-tree-card" onClick={() => onClick(tree)}>
      <div className="mini-tree-container">
        <svg viewBox="0 0 80 100" className="mini-tree-svg">
          {/* Simple trunk */}
          <line x1="40" y1="90" x2="40" y2="45" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" />
          {/* Simple branches */}
          <line x1="40" y1="60" x2="25" y2="48" stroke="#7A5230" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="55" x2="58" y2="42" stroke="#7A5230" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="65" x2="55" y2="55" stroke="#7A5230" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="50" x2="30" y2="38" stroke="#7A5230" strokeWidth="1.5" strokeLinecap="round" />
          {/* Leaf cluster (circle canopy proportional to fullness) */}
          {leafCount > 0 && (
            <>
              <circle cx="40" cy="42" r={12 + fullness * 10} fill={tree.type === 'gratitude' ? '#FFB7C5' : '#4a7a4a'} opacity={0.25 + fullness * 0.3} />
              <circle cx="32" cy="48" r={8 + fullness * 6} fill={tree.type === 'gratitude' ? '#FFB7C5' : '#5a8a5a'} opacity={0.2 + fullness * 0.25} />
              <circle cx="50" cy="46" r={8 + fullness * 6} fill={tree.type === 'gratitude' ? '#FFB7C5' : '#5a8a5a'} opacity={0.2 + fullness * 0.25} />
            </>
          )}
          {/* Ground dot */}
          <ellipse cx="40" cy="92" rx="12" ry="3" fill="#1a3a1a" opacity="0.5" />
        </svg>
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

export default function OrchardView({ trees, treeLeaveCounts, onSelectTree, onCreateTree }) {
  return (
    <div className="orchard-view">
      <div className="orchard-header">
        <h2 className="orchard-title">Your Orchard</h2>
        <p className="orchard-subtitle">{trees.length} tree{trees.length !== 1 ? 's' : ''} growing</p>
      </div>

      <div className="orchard-grid">
        {/* New tree buttons */}
        <button className="new-tree-card" onClick={() => onCreateTree('emotion')}>
          <div className="new-tree-icon">
            <TreePine size={24} />
          </div>
          <span className="new-tree-label">New Emotion Tree</span>
        </button>

        <button className="new-tree-card new-tree-gratitude" onClick={() => onCreateTree('gratitude')}>
          <div className="new-tree-icon">
            <Flower2 size={24} />
          </div>
          <span className="new-tree-label">New Gratitude Tree</span>
        </button>

        {/* Existing trees */}
        {trees.map((tree) => (
          <MiniTree
            key={tree.id}
            tree={tree}
            leafCount={treeLeaveCounts[tree.id] || 0}
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
