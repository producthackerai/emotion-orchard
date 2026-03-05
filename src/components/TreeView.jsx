import { useState, useCallback } from 'react'
import { Share2, Lock, Unlock, Trash2, Edit3, Shuffle } from 'lucide-react'
import TreeCanvas from './TreeCanvas'
import EmotionPalette from './EmotionPalette'
import GratitudeInput from './GratitudeInput'
import '../styles/TreeView.css'

export default function TreeView({ tree, leaves, onAddLeaf, onUpdateTree, onDeleteTree, getAuthHeaders }) {
  const [newLeafId, setNewLeafId] = useState(null)
  const [recentEmotion, setRecentEmotion] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(tree?.name || '')
  const [showMenu, setShowMenu] = useState(false)
  const [positionSeed, setPositionSeed] = useState(0)
  const [isScattering, setIsScattering] = useState(false)
  const isFull = leaves.length >= 30

  const handleEmotionSelect = useCallback(async (emotion) => {
    if (isFull) return

    const leaf = await onAddLeaf({
      tree_id: tree.id,
      emotion: emotion.name,
      color: emotion.color,
    })

    if (leaf) {
      setNewLeafId(leaf.id)
      setRecentEmotion(emotion.name)
      setTimeout(() => setNewLeafId(null), 1000)
    }
  }, [tree?.id, onAddLeaf, isFull])

  const handleGratitudeSubmit = useCallback(async (data) => {
    if (isFull) return

    const leaf = await onAddLeaf({
      tree_id: tree.id,
      ...data,
    })

    if (leaf) {
      setNewLeafId(leaf.id)
      setTimeout(() => setNewLeafId(null), 1000)
    }
  }, [tree?.id, onAddLeaf, isFull])

  const handleRearrange = useCallback(() => {
    if (leaves.length < 2 || isScattering) return
    setIsScattering(true)
    // After scatter animation, land in new positions
    setTimeout(() => {
      setPositionSeed(prev => prev + 1)
      setIsScattering(false)
    }, 1200)
  }, [leaves.length, isScattering])

  const handleSaveName = () => {
    if (editName.trim() && editName !== tree.name) {
      onUpdateTree(tree.id, { name: editName.trim() })
    }
    setIsEditing(false)
  }

  const handleTogglePublic = () => {
    onUpdateTree(tree.id, { is_public: !tree.is_public })
    setShowMenu(false)
  }

  const handleShare = async () => {
    if (tree.is_public) {
      const url = `${window.location.origin}/tree/${tree.id}`
      try {
        await navigator.share?.({ title: tree.name, url }) ||
          navigator.clipboard.writeText(url)
      } catch {
        navigator.clipboard.writeText(url)
      }
    }
    setShowMenu(false)
  }

  if (!tree) return null

  const treeSeed = tree.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  return (
    <div className="tree-view">
      {/* Tree info bar */}
      <div className="tree-info">
        <div className="tree-info-left">
          {isEditing ? (
            <input
              className="tree-name-edit"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
              maxLength={40}
            />
          ) : (
            <h2 className="tree-name" onDoubleClick={() => { setEditName(tree.name); setIsEditing(true) }}>
              {tree.name}
            </h2>
          )}
          <span className="tree-date">
            {new Date(tree.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="tree-actions">
          {leaves.length >= 2 && (
            <button
              className={`tree-action-btn ${isScattering ? 'tree-action-spinning' : ''}`}
              onClick={handleRearrange}
              aria-label="Rearrange leaves"
              disabled={isScattering}
            >
              <Shuffle size={14} />
            </button>
          )}
          <button
            className="tree-action-btn"
            onClick={() => { setEditName(tree.name); setIsEditing(true) }}
            aria-label="Edit name"
          >
            <Edit3 size={14} />
          </button>
          <button
            className="tree-action-btn"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More options"
          >
            {tree.is_public ? <Unlock size={14} /> : <Lock size={14} />}
          </button>
        </div>

        {showMenu && (
          <div className="tree-menu">
            <button onClick={handleTogglePublic}>
              {tree.is_public ? <><Lock size={12} /> Make Private</> : <><Unlock size={12} /> Make Public</>}
            </button>
            {tree.is_public && (
              <button onClick={handleShare}>
                <Share2 size={12} /> Share Link
              </button>
            )}
            <button className="tree-menu-danger" onClick={() => { onDeleteTree(tree.id); setShowMenu(false) }}>
              <Trash2 size={12} /> Delete Tree
            </button>
          </div>
        )}
      </div>

      {/* Tree display */}
      <TreeCanvas
        leaves={leaves}
        treeType={tree.type}
        treeSeed={treeSeed}
        newLeafId={newLeafId}
        positionSeed={positionSeed}
        isScattering={isScattering}
      />

      {/* Full tree message */}
      {isFull && (
        <div className="tree-full-msg">
          This tree is fully grown. Start a new one to continue your journey.
        </div>
      )}

      {/* Input area */}
      {tree.type === 'emotion' ? (
        <EmotionPalette
          onSelect={handleEmotionSelect}
          disabled={isFull}
          recentEmotion={recentEmotion}
        />
      ) : (
        <GratitudeInput
          onSubmit={handleGratitudeSubmit}
          disabled={isFull}
        />
      )}
    </div>
  )
}
