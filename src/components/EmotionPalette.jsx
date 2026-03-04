import { EMOTIONS } from '../data/emotions'
import '../styles/EmotionPalette.css'

export default function EmotionPalette({ onSelect, disabled = false, recentEmotion = null }) {
  return (
    <div className="emotion-palette">
      <div className="palette-grid">
        {EMOTIONS.map((emotion) => (
          <button
            key={emotion.name}
            className={`emotion-btn ${recentEmotion === emotion.name ? 'emotion-btn-recent' : ''}`}
            onClick={() => !disabled && onSelect(emotion)}
            disabled={disabled}
            style={{ '--emotion-color': emotion.color }}
            aria-label={emotion.name}
          >
            <span className="emotion-dot" style={{ backgroundColor: emotion.color }} />
            <span className="emotion-label">{emotion.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
