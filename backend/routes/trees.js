import { Router } from 'express'
import { supabase } from '../supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Get all trees for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eo_trees')
      .select('*, eo_leaves(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Error fetching trees:', err)
    res.status(500).json({ error: 'Failed to fetch trees' })
  }
})

// Get a single tree with leaves
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data: tree, error } = await supabase
      .from('eo_trees')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error

    // Check access — owner or public
    if (tree.user_id !== req.user.id && !tree.is_public) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { data: leaves } = await supabase
      .from('eo_leaves')
      .select('*')
      .eq('tree_id', tree.id)
      .order('created_at', { ascending: true })

    res.json({ ...tree, leaves: leaves || [] })
  } catch (err) {
    console.error('Error fetching tree:', err)
    res.status(500).json({ error: 'Failed to fetch tree' })
  }
})

// Get a public tree (no auth required)
router.get('/public/:id', async (req, res) => {
  try {
    const { data: tree, error } = await supabase
      .from('eo_trees')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_public', true)
      .single()

    if (error) throw error

    const { data: leaves } = await supabase
      .from('eo_leaves')
      .select('*')
      .eq('tree_id', tree.id)
      .order('created_at', { ascending: true })

    const { data: comments } = await supabase
      .from('eo_comments')
      .select('*')
      .eq('tree_id', tree.id)
      .order('created_at', { ascending: true })

    res.json({ ...tree, leaves: leaves || [], comments: comments || [] })
  } catch (err) {
    res.status(404).json({ error: 'Tree not found' })
  }
})

// Create a new tree
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type = 'emotion', name } = req.body
    const id = `tree-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const { data, error } = await supabase
      .from('eo_trees')
      .insert({
        id,
        user_id: req.user.id,
        type,
        name: name || (type === 'emotion' ? 'Emotion Tree' : 'Gratitude Tree'),
        is_public: false,
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Error creating tree:', err)
    res.status(500).json({ error: 'Failed to create tree' })
  }
})

// Update a tree
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { name, is_public } = req.body

    const { data, error } = await supabase
      .from('eo_trees')
      .update({ name, is_public, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Error updating tree:', err)
    res.status(500).json({ error: 'Failed to update tree' })
  }
})

// Delete a tree
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('eo_trees')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting tree:', err)
    res.status(500).json({ error: 'Failed to delete tree' })
  }
})

export default router
