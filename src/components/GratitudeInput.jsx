import { useState } from 'react'
import { Heart } from 'lucide-react'
import '../styles/GratitudeInput.css'

const BLOSSOM_COLOR = '#FFB7C5'

export default function GratitudeInput({ onSubmit, disabled = false }) {
  const [personName, setPersonName] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!personName.trim() || disabled) return

    onSubmit({
      person_name: personName.trim(),
      note: note.trim() || null,
      color: BLOSSOM_COLOR,
    })

    setPersonName('')
    setNote('')
  }

  return (
    <form className="gratitude-input" onSubmit={handleSubmit}>
      <div className="gratitude-fields">
        <div className="gratitude-person-row">
          <Heart size={14} className="gratitude-icon" />
          <input
            type="text"
            placeholder="Who are you grateful for?"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="gratitude-name-input"
            disabled={disabled}
            maxLength={50}
          />
        </div>
        <textarea
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="gratitude-note-input"
          disabled={disabled}
          rows={2}
          maxLength={200}
        />
      </div>
      <button
        type="submit"
        className="gratitude-submit"
        disabled={disabled || !personName.trim()}
      >
        Add Blossom
      </button>
    </form>
  )
}
