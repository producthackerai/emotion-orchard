import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import '../styles/FeedbackPage.css'

export default function FeedbackPage({ getAuthHeaders }) {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const API_BASE = import.meta.env.DEV ? 'http://localhost:3007' : ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!feedback.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type: 'feature', feedback: feedback.trim() }),
      })
      if (res.ok) {
        setSubmitted(true)
        setFeedback('')
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="feedback-page">
        <div className="feedback-success">
          <CheckCircle size={32} className="feedback-success-icon" />
          <p className="feedback-success-title">Thanks for sharing!</p>
          <p className="feedback-success-text">
            Your feedback helps Emotion Orchard grow.
          </p>
          <button className="feedback-another" onClick={() => setSubmitted(false)}>
            Send another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <h2 className="feedback-title">Share Your Thoughts</h2>
        <p className="feedback-subtitle">
          Ideas, bugs, or feature requests — we'd love to hear from you.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            className="feedback-textarea"
            placeholder="What would make Emotion Orchard better for you?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={5}
            maxLength={1000}
          />
          <button type="submit" className="feedback-submit" disabled={!feedback.trim() || loading}>
            <Send size={14} />
            {loading ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>
    </div>
  )
}
