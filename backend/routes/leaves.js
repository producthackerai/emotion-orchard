import { Router } from 'express'
import { supabase } from '../supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Add a leaf to a tree
router.post('/', requireAuth, async (req, res) => {
  try {
    const { tree_id, emotion, color, person_name, note } = req.body

    // Verify tree ownership
    const { data: tree, error: treeErr } = await supabase
      .from('eo_trees')
      .select('id, user_id, type')
      .eq('id', tree_id)
      .eq('user_id', req.user.id)
      .single()

    if (treeErr || !tree) {
      return res.status(404).json({ error: 'Tree not found' })
    }

    // Check leaf count (max 30)
    const { count } = await supabase
      .from('eo_leaves')
      .select('*', { count: 'exact', head: true })
      .eq('tree_id', tree_id)

    if (count >= 30) {
      return res.status(400).json({ error: 'Tree is full (max 30 leaves)' })
    }

    // Calculate position along branch
    const leafIndex = count || 0
    const position = calculateLeafPosition(leafIndex)

    const id = `leaf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const { data, error } = await supabase
      .from('eo_leaves')
      .insert({
        id,
        tree_id,
        user_id: req.user.id,
        emotion: tree.type === 'emotion' ? emotion : null,
        color,
        person_name: tree.type === 'gratitude' ? person_name : null,
        note,
        position_x: position.x,
        position_y: position.y,
        branch_index: position.branch,
      })
      .select()
      .single()

    if (error) throw error

    // Update tree timestamp
    await supabase
      .from('eo_trees')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', tree_id)

    res.json(data)
  } catch (err) {
    console.error('Error adding leaf:', err)
    res.status(500).json({ error: 'Failed to add leaf' })
  }
})

// Delete a leaf
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('eo_leaves')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting leaf:', err)
    res.status(500).json({ error: 'Failed to delete leaf' })
  }
})

// Get leaves for a tree
router.get('/tree/:treeId', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eo_leaves')
      .select('*')
      .eq('tree_id', req.params.treeId)
      .order('created_at', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Error fetching leaves:', err)
    res.status(500).json({ error: 'Failed to fetch leaves' })
  }
})

// Calculate leaf position based on index (distributes across branches)
function calculateLeafPosition(index) {
  // 7 main branches, each with sub-positions
  const branchCount = 7
  const branch = index % branchCount
  const positionOnBranch = Math.floor(index / branchCount)

  // Branch angles (alternating left/right, varying heights)
  const branchConfigs = [
    { baseX: 0.35, baseY: 0.25, dx: -0.12, dy: -0.05 },
    { baseX: 0.65, baseY: 0.25, dx: 0.12, dy: -0.05 },
    { baseX: 0.30, baseY: 0.35, dx: -0.15, dy: -0.03 },
    { baseX: 0.70, baseY: 0.35, dx: 0.15, dy: -0.03 },
    { baseX: 0.38, baseY: 0.45, dx: -0.10, dy: -0.02 },
    { baseX: 0.62, baseY: 0.45, dx: 0.10, dy: -0.02 },
    { baseX: 0.50, baseY: 0.18, dx: 0.0, dy: -0.08 },
  ]

  const config = branchConfigs[branch]
  const t = 0.5 + positionOnBranch * 0.3 // distance along branch
  const jitter = (Math.sin(index * 7.3) * 0.03) // deterministic jitter

  return {
    x: Math.max(0.05, Math.min(0.95, config.baseX + config.dx * t + jitter)),
    y: Math.max(0.05, Math.min(0.95, config.baseY + config.dy * t + jitter * 0.5)),
    branch,
  }
}

export default router
