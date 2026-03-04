import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from './middleware/auth.js'
import { rateLimit } from './middleware/rateLimit.js'
import { registerPrompt } from './taoClient.js'
import treesRouter from './routes/trees.js'
import leavesRouter from './routes/leaves.js'
import chatRouter from './routes/chat.js'
import feedbackRouter from './routes/feedback.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3007

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '1mb' }))
app.use(authMiddleware)
app.use(rateLimit({ windowMs: 60000, max: 200 }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'emotion-orchard', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/trees', treesRouter)
app.use('/api/leaves', leavesRouter)
app.use('/api/chat', chatRouter)
app.use('/api/feedback', feedbackRouter)

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

app.listen(PORT, () => {
  console.log(`Emotion Orchard backend running on port ${PORT}`)
})

// Register prompts with Tao
registerPrompt({
  name: 'Emotion Orchard Chat',
  description: 'AI companion for emotional reflection and analysis',
  version: '1.0.0',
})
