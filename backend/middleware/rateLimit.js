const requests = new Map()

export function rateLimit({ windowMs = 60000, max = 200 } = {}) {
  return (req, res, next) => {
    const key = req.user?.id || req.ip
    const now = Date.now()

    if (!requests.has(key)) {
      requests.set(key, [])
    }

    const timestamps = requests.get(key).filter(t => now - t < windowMs)
    timestamps.push(now)
    requests.set(key, timestamps)

    if (timestamps.length > max) {
      return res.status(429).json({ error: 'Too many requests' })
    }

    next()
  }
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of requests) {
    const recent = timestamps.filter(t => now - t < 60000)
    if (recent.length === 0) {
      requests.delete(key)
    } else {
      requests.set(key, recent)
    }
  }
}, 300000)
