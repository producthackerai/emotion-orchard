import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './components/AuthPage'
import Header from './components/Header'
import TreeView from './components/TreeView'
import OrchardView from './components/OrchardView'
import AnalysisView from './components/AnalysisView'
import ChatPage from './components/ChatPage'
import FeedbackPage from './components/FeedbackPage'
import SettingsPage from './components/SettingsPage'
import ReleaseNotes from './components/ReleaseNotes'
import { TreePine, Flower2, BarChart3, MessageCircle } from 'lucide-react'
import './styles/App.css'

const API_BASE = import.meta.env.DEV ? 'http://localhost:3007' : ''

export default function App() {
  const { user, session, loading } = useAuth()
  const [view, setView] = useState('orchard') // orchard, tree, analysis, chat, settings, feedback, releases
  const [trees, setTrees] = useState([])
  const [currentTree, setCurrentTree] = useState(null)
  const [currentLeaves, setCurrentLeaves] = useState([])
  const [allLeaves, setAllLeaves] = useState([])
  const [treeLeaveCounts, setTreeLeaveCounts] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)

  // Theme — light default, persisted
  const [theme, setTheme] = useState(() => localStorage.getItem('eo-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('eo-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }), [session?.access_token])

  // Fetch all trees on mount
  useEffect(() => {
    if (!user) return
    fetchTrees()
  }, [user])

  async function fetchTrees() {
    try {
      const res = await fetch(`${API_BASE}/api/trees`, { headers: getAuthHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setTrees(data)

      // Build leaf counts
      const counts = {}
      for (const tree of data) {
        counts[tree.id] = tree.eo_leaves?.[0]?.count || 0
      }
      setTreeLeaveCounts(counts)

      // Fetch all leaves for analysis
      const leavesPromises = data.map(tree =>
        fetch(`${API_BASE}/api/leaves/tree/${tree.id}`, { headers: getAuthHeaders() })
          .then(r => r.ok ? r.json() : [])
      )
      const allLeavesArrays = await Promise.all(leavesPromises)
      setAllLeaves(allLeavesArrays.flat())
      setDataLoaded(true)
    } catch (err) {
      console.error('Failed to fetch trees:', err)
    }
  }

  async function fetchTreeLeaves(treeId) {
    try {
      const res = await fetch(`${API_BASE}/api/leaves/tree/${treeId}`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentLeaves(data)
        return data
      }
    } catch {}
    return []
  }

  async function handleSelectTree(tree) {
    setCurrentTree(tree)
    setView('tree')
    await fetchTreeLeaves(tree.id)
  }

  async function handleCreateTree(type) {
    try {
      const res = await fetch(`${API_BASE}/api/trees`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type }),
      })
      if (!res.ok) return

      const newTree = await res.json()
      setTrees(prev => [newTree, ...prev])
      setTreeLeaveCounts(prev => ({ ...prev, [newTree.id]: 0 }))
      setCurrentTree(newTree)
      setCurrentLeaves([])
      setView('tree')
    } catch (err) {
      console.error('Failed to create tree:', err)
    }
  }

  async function handleAddLeaf(leafData) {
    try {
      const res = await fetch(`${API_BASE}/api/leaves`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(leafData),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('Add leaf error:', err)
        return null
      }

      const newLeaf = await res.json()
      setCurrentLeaves(prev => [...prev, newLeaf])
      setAllLeaves(prev => [...prev, newLeaf])
      setTreeLeaveCounts(prev => ({
        ...prev,
        [leafData.tree_id]: (prev[leafData.tree_id] || 0) + 1,
      }))
      return newLeaf
    } catch (err) {
      console.error('Failed to add leaf:', err)
      return null
    }
  }

  async function handleUpdateTree(treeId, updates) {
    try {
      const res = await fetch(`${API_BASE}/api/trees/${treeId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })
      if (!res.ok) return

      const updated = await res.json()
      setTrees(prev => prev.map(t => t.id === treeId ? { ...t, ...updated } : t))
      if (currentTree?.id === treeId) {
        setCurrentTree(prev => ({ ...prev, ...updated }))
      }
    } catch {}
  }

  async function handleDeleteTree(treeId) {
    try {
      const res = await fetch(`${API_BASE}/api/trees/${treeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) return

      setTrees(prev => prev.filter(t => t.id !== treeId))
      setAllLeaves(prev => prev.filter(l => l.tree_id !== treeId))
      const newCounts = { ...treeLeaveCounts }
      delete newCounts[treeId]
      setTreeLeaveCounts(newCounts)

      if (currentTree?.id === treeId) {
        setCurrentTree(null)
        setView('orchard')
      }
    } catch {}
  }

  function handleBack() {
    if (view === 'tree') {
      setView('orchard')
      setCurrentTree(null)
    } else {
      setView('orchard')
    }
  }

  function handleNavigate(newView) {
    setView(newView)
  }

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-tree">
          <svg viewBox="0 0 40 50" width="40" height="50">
            <line x1="20" y1="45" x2="20" y2="20" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" />
            <circle cx="20" cy="16" r="8" fill="#8FBC8F" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
    )
  }

  // Auth gate
  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="app">
      <Header
        currentView={view}
        onBack={handleBack}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="app-main">
        {view === 'orchard' && (
          <OrchardView
            trees={trees}
            treeLeaveCounts={treeLeaveCounts}
            onSelectTree={handleSelectTree}
            onCreateTree={handleCreateTree}
          />
        )}

        {view === 'tree' && currentTree && (
          <TreeView
            tree={currentTree}
            leaves={currentLeaves}
            onAddLeaf={handleAddLeaf}
            onUpdateTree={handleUpdateTree}
            onDeleteTree={handleDeleteTree}
            getAuthHeaders={getAuthHeaders}
          />
        )}

        {view === 'analysis' && (
          <AnalysisView
            trees={trees}
            allLeaves={allLeaves}
          />
        )}

        {view === 'chat' && (
          <ChatPage getAuthHeaders={getAuthHeaders} />
        )}

        {view === 'settings' && (
          <SettingsPage onNavigate={handleNavigate} />
        )}

        {view === 'feedback' && (
          <FeedbackPage getAuthHeaders={getAuthHeaders} />
        )}

        {view === 'releases' && (
          <ReleaseNotes />
        )}
      </main>

      {/* Bottom Navigation — mobile-first */}
      {!['settings', 'feedback', 'releases'].includes(view) && (
        <nav className="bottom-nav">
          <button
            className={`nav-item ${view === 'orchard' ? 'nav-active' : ''}`}
            onClick={() => { setView('orchard'); setCurrentTree(null) }}
          >
            <TreePine size={20} />
            <span>Orchard</span>
          </button>
          <button
            className={`nav-item ${view === 'tree' ? 'nav-active' : ''}`}
            onClick={() => {
              if (currentTree) {
                setView('tree')
              } else if (trees.length > 0) {
                handleSelectTree(trees[0])
              } else {
                handleCreateTree('emotion')
              }
            }}
          >
            <Flower2 size={20} />
            <span>Tree</span>
          </button>
          <button
            className={`nav-item ${view === 'analysis' ? 'nav-active' : ''}`}
            onClick={() => setView('analysis')}
          >
            <BarChart3 size={20} />
            <span>Insights</span>
          </button>
          <button
            className={`nav-item ${view === 'chat' ? 'nav-active' : ''}`}
            onClick={() => setView('chat')}
          >
            <MessageCircle size={20} />
            <span>Chat</span>
          </button>
        </nav>
      )}

      {/* Footer — only on scrollable views */}
      {['orchard', 'analysis', 'settings', 'feedback', 'releases'].includes(view) && (
        <footer className="app-footer">
          <p>
            Brought to you by <a href="https://producthacker.ai" target="_blank" rel="noopener noreferrer">Product Hacker Production</a>
            {' '}&middot;{' '}
            Evaluated by <a href="https://taodata.ai" target="_blank" rel="noopener noreferrer">Tao Data</a>
            {' '}&middot;{' '}
            Deployed by <a href="https://hiveforge.dev" target="_blank" rel="noopener noreferrer">HiveForge</a>
            {' '}&middot;{' '}
            (Humans Behind the Scenes: <a href="https://www.linkedin.com/in/camfortin/" target="_blank" rel="noopener noreferrer">Cam Fortin</a> and <a href="https://www.linkedin.com/in/jody-roberts/" target="_blank" rel="noopener noreferrer">Jody Roberts</a>)
          </p>
        </footer>
      )}
    </div>
  )
}
