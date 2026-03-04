import { MessageSquare, BookOpen, Info } from 'lucide-react'
import '../styles/SettingsPage.css'

export default function SettingsPage({ onNavigate }) {
  return (
    <div className="settings-page">
      <div className="settings-container">
        <h2 className="settings-title">Settings</h2>

        <div className="settings-section">
          <button className="settings-row" onClick={() => onNavigate('feedback')}>
            <MessageSquare size={16} className="settings-row-icon" />
            <div className="settings-row-text">
              <span className="settings-row-label">Send Feedback</span>
              <span className="settings-row-desc">Ideas, bugs, feature requests</span>
            </div>
          </button>

          <button className="settings-row" onClick={() => onNavigate('releases')}>
            <BookOpen size={16} className="settings-row-icon" />
            <div className="settings-row-text">
              <span className="settings-row-label">Release Notes</span>
              <span className="settings-row-desc">What's new in Emotion Orchard</span>
            </div>
          </button>

          <div className="settings-row settings-row-static">
            <Info size={16} className="settings-row-icon" />
            <div className="settings-row-text">
              <span className="settings-row-label">About</span>
              <span className="settings-row-desc">Emotion Orchard v1.0.0</span>
            </div>
          </div>
        </div>

        <div className="settings-note">
          <p>
            Emotion Orchard is not a replacement for professional mental health support.
            If you're in crisis, please contact the{' '}
            <a href="tel:988">988 Suicide & Crisis Lifeline</a>{' '}
            or text HOME to 741741.
          </p>
        </div>
      </div>
    </div>
  )
}
