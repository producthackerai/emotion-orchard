import { useState, useEffect, useRef } from 'react'
import { Send, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import '../styles/ChatPage.css'

export default function ChatPage({ getAuthHeaders }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const API_BASE = import.meta.env.DEV ? 'http://localhost:3007' : ''

  // Load history on mount
  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/chat/history`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.map(m => ({ role: m.role, content: m.content })))
      }
    } catch {}
  }

  async function handleSend(e) {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: userMsg }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Chat failed')
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't respond right now. ${err.message}`,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function handleClear() {
    try {
      await fetch(`${API_BASE}/api/chat/history`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      setMessages([])
    } catch {}
  }

  return (
    <div className="chat-page">
      <div className="chat-toolbar">
        <span className="chat-toolbar-label">Orchard Companion</span>
        {messages.length > 0 && (
          <button className="chat-clear-btn" onClick={handleClear}>
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-welcome">
            <p className="chat-welcome-title">Hey there</p>
            <p className="chat-welcome-text">
              I'm your Orchard companion. Ask me about your emotional patterns,
              get reflection prompts, or just share how you're feeling.
            </p>
            <div className="chat-suggestions">
              <button onClick={() => { setInput('How am I doing emotionally?'); }}>
                How am I doing?
              </button>
              <button onClick={() => { setInput('What patterns do you see in my orchard?'); }}>
                See any patterns?
              </button>
              <button onClick={() => { setInput('Help me reflect on today'); }}>
                Help me reflect
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
            <div className="chat-msg-content">
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-msg chat-msg-assistant">
            <div className="chat-msg-content chat-typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Share what's on your mind..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="chat-input"
          disabled={loading}
          maxLength={500}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || loading}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
