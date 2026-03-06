import { useMemo } from 'react'
import '../styles/AmbientParticles.css'

function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Floating pollen / sparkle particles for any view
export function FloatingParticles({ count = 12, seed = 42 }) {
  const particles = useMemo(() => {
    const s = (n) => seededRandom(seed + n)
    return Array.from({ length: count }, (_, i) => ({
      left: s(i * 3) * 100,
      delay: s(i * 3 + 1) * 12,
      dur: 8 + s(i * 3 + 2) * 10,
      size: 2 + s(i * 5) * 4,
      drift: -30 + s(i * 7) * 60,
      type: s(i * 9) > 0.6 ? 'sparkle' : 'pollen',
    }))
  }, [count, seed])

  return (
    <div className="floating-particles" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          className={`particle particle-${p.type}`}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

// Orchard-specific fireflies that float between trees
export function OrchardFireflies({ count = 6, seed = 77 }) {
  const flies = useMemo(() => {
    const s = (n) => seededRandom(seed + n)
    return Array.from({ length: count }, (_, i) => ({
      left: 10 + s(i * 4) * 80,
      top: 20 + s(i * 4 + 1) * 60,
      delay: s(i * 4 + 2) * 8,
      dur: 4 + s(i * 4 + 3) * 5,
      size: 4 + s(i * 6) * 4,
    }))
  }, [count, seed])

  return (
    <div className="orchard-fireflies" aria-hidden="true">
      {flies.map((f, i) => (
        <div
          key={i}
          className="orchard-fly"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.dur}s`,
          }}
        />
      ))}
    </div>
  )
}
