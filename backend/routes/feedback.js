import { Router } from 'express'
import { supabase } from '../supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, feedback } = req.body

    if (!feedback?.trim()) {
      return res.status(400).json({ error: 'Feedback is required' })
    }

    const { error } = await supabase
      .from('tc_feature_requests')
      .insert({
        title: feedback.slice(0, 100),
        description: feedback,
        type: type || 'feature',
        status: 'submitted',
        tags: ['emotion-orchard'],
        submitter_email: req.user.email,
        owner_user_id: req.user.id,
        submitter_id: req.user.id,
      })

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('Error submitting feedback:', err)
    res.status(500).json({ error: 'Failed to submit feedback' })
  }
})

export default router
