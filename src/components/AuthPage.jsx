import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import '../styles/AuthPage.css'

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isReset) {
        const { error } = await resetPassword(email)
        if (error) throw error
        setMessage('Check your email for a reset link')
        setIsReset(false)
      } else if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMessage('Check your email to confirm your account')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Logo / Hero */}
        <div className="auth-hero">
          <svg viewBox="0 0 80 80" className="auth-logo">
            <line x1="40" y1="70" x2="40" y2="30" stroke="#8B5E3C" strokeWidth="4" strokeLinecap="round" />
            <line x1="40" y1="45" x2="25" y2="32" stroke="#7A5230" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="40" x2="58" y2="28" stroke="#7A5230" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M25,32 C22,28 24,24 28,26 C30,22 34,24 32,28" fill="#8FBC8F" opacity="0.7" />
            <path d="M58,28 C62,24 64,26 62,30 C66,30 64,34 60,32" fill="#FFD700" opacity="0.7" />
            <path d="M40,30 C36,26 38,22 42,24 C44,20 48,22 46,26 C50,26 48,30 44,28" fill="#FF69B4" opacity="0.7" />
            <ellipse cx="40" cy="72" rx="14" ry="3" fill="#1a3a1a" opacity="0.4" />
          </svg>
          <h1 className="auth-title">Emotion Orchard</h1>
          <p className="auth-subtitle">Grow your feelings into something beautiful</p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
            autoComplete="email"
          />

          {!isReset && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '...' : isReset ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          {isReset ? (
            <button onClick={() => setIsReset(false)}>Back to sign in</button>
          ) : (
            <>
              <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}>
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
              {!isSignUp && (
                <button onClick={() => setIsReset(true)}>Forgot password?</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
