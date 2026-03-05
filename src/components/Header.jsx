import { LogOut, Settings, ChevronLeft, Sun, Moon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Header.css'

export default function Header({ currentView, onBack, onNavigate, theme, onToggleTheme }) {
  const { signOut } = useAuth()

  const showBack = currentView === 'tree' || currentView === 'settings' ||
                   currentView === 'feedback' || currentView === 'releases'

  return (
    <header className="app-header">
      <div className="header-left">
        {showBack ? (
          <button className="header-btn" onClick={onBack} aria-label="Back">
            <ChevronLeft size={18} />
          </button>
        ) : (
          <div className="header-logo">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <line x1="12" y1="22" x2="12" y2="10" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="14" x2="7" y2="9" stroke="#7A5230" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="12" x2="18" y2="8" stroke="#7A5230" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="8" r="2.5" fill="#8FBC8F" opacity="0.8" />
              <circle cx="18" cy="7" r="2.5" fill="#FFD700" opacity="0.8" />
              <circle cx="12" cy="6" r="3" fill="#FF69B4" opacity="0.8" />
            </svg>
          </div>
        )}
        <h1 className="header-title">
          {showBack ? getViewTitle(currentView) : 'Emotion Orchard'}
        </h1>
      </div>

      <div className="header-right">
        <button
          className="header-btn"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          className="header-btn"
          onClick={() => onNavigate('settings')}
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          className="header-btn"
          onClick={signOut}
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

function getViewTitle(view) {
  switch (view) {
    case 'tree': return 'Tree'
    case 'settings': return 'Settings'
    case 'feedback': return 'Feedback'
    case 'releases': return 'Release Notes'
    default: return 'Emotion Orchard'
  }
}
