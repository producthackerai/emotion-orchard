import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { canUserMakeAICall, recordUserAICall } from '../lib/aiUsage.js'
import { logExecution, createUsageAccumulator, accumulateUsage } from '../lib/costTracker.js'
import { logTrace } from '../taoClient.js'

const router = Router()
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are the Emotion Orchard companion — a warm, gentle AI guide for emotional reflection and awareness.

You help users explore their emotional landscape through their Emotion Orchard, a visual garden where emotions and gratitude grow as leaves on trees.

Your personality:
- Warm, empathetic, and affirming — never clinical or judgmental
- You celebrate emotional awareness, even with difficult emotions
- You use nature metaphors naturally (growth, seasons, blooming, roots)
- Brief and conversational — not therapy-speak, just a caring friend
- You acknowledge all emotions as valid and meaningful

You have access to the user's orchard data and can:
- Help them reflect on emotional patterns
- Offer gentle insights about their emotional distribution
- Suggest new emotions to explore
- Celebrate growth and milestones
- Help with gratitude practices

Important: You are NOT a therapist. If someone shares something concerning (self-harm, crisis), gently direct them to professional resources (988 Suicide & Crisis Lifeline, Crisis Text Line).

Keep responses concise — 2-3 sentences usually. This is a mobile app, not a therapy session.`

const TOOLS = [
  {
    name: 'get_orchard_summary',
    description: 'Get a summary of the user\'s entire orchard — all trees with leaf counts and emotion distributions',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_tree_detail',
    description: 'Get detailed information about a specific tree including all its leaves',
    input_schema: {
      type: 'object',
      properties: {
        tree_id: { type: 'string', description: 'The tree ID to look up' },
      },
      required: ['tree_id'],
    },
  },
  {
    name: 'get_emotion_insights',
    description: 'Analyze the user\'s overall emotional patterns across all trees',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
]

async function executeTool(toolName, toolInput, userId) {
  switch (toolName) {
    case 'get_orchard_summary': {
      const { data: trees } = await supabase
        .from('eo_trees')
        .select('id, type, name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!trees?.length) return { trees: [], message: 'No trees yet' }

      const treeSummaries = await Promise.all(trees.map(async (tree) => {
        const { data: leaves } = await supabase
          .from('eo_leaves')
          .select('emotion, color, person_name')
          .eq('tree_id', tree.id)

        const emotionCounts = {}
        for (const leaf of (leaves || [])) {
          const key = leaf.emotion || leaf.person_name || 'unknown'
          emotionCounts[key] = (emotionCounts[key] || 0) + 1
        }

        return {
          ...tree,
          leaf_count: leaves?.length || 0,
          emotion_distribution: emotionCounts,
        }
      }))

      return { trees: treeSummaries, total_trees: trees.length }
    }

    case 'get_tree_detail': {
      const { data: tree } = await supabase
        .from('eo_trees')
        .select('*')
        .eq('id', toolInput.tree_id)
        .eq('user_id', userId)
        .single()

      if (!tree) return { error: 'Tree not found' }

      const { data: leaves } = await supabase
        .from('eo_leaves')
        .select('*')
        .eq('tree_id', tree.id)
        .order('created_at', { ascending: true })

      return { ...tree, leaves: leaves || [] }
    }

    case 'get_emotion_insights': {
      const { data: leaves } = await supabase
        .from('eo_leaves')
        .select('emotion, color, created_at')
        .eq('user_id', userId)
        .not('emotion', 'is', null)
        .order('created_at', { ascending: true })

      if (!leaves?.length) return { message: 'Not enough data for insights yet' }

      const emotionCounts = {}
      const recentEmotions = []
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      for (const leaf of leaves) {
        emotionCounts[leaf.emotion] = (emotionCounts[leaf.emotion] || 0) + 1
        if (leaf.created_at > oneWeekAgo) {
          recentEmotions.push(leaf.emotion)
        }
      }

      const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])

      return {
        total_leaves: leaves.length,
        most_frequent: sorted[0]?.[0],
        least_frequent: sorted[sorted.length - 1]?.[0],
        distribution: Object.fromEntries(sorted),
        recent_week: recentEmotions,
        unique_emotions: sorted.length,
      }
    }

    default:
      return { error: 'Unknown tool' }
  }
}

router.post('/', requireAuth, rateLimit({ windowMs: 60000, max: 30 }), async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const allowed = await canUserMakeAICall(req.user.id)
    if (!allowed) {
      return res.status(429).json({ error: 'Daily AI limit reached. Try again tomorrow.' })
    }

    // Fetch chat history
    const { data: history } = await supabase
      .from('eo_chat_messages')
      .select('role, content')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Save user message
    await supabase.from('eo_chat_messages').insert({
      user_id: req.user.id,
      role: 'user',
      content: message,
    })

    const messages = [
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const anthropic = new Anthropic()
    const usageAcc = createUsageAccumulator()
    const toolsUsed = []

    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    })
    accumulateUsage(usageAcc, response)

    // Tool loop (max 5 iterations)
    let iterations = 0
    while (response.stop_reason === 'tool_use' && iterations < 5) {
      iterations++
      const toolBlocks = response.content.filter(b => b.type === 'tool_use')
      const toolResults = []

      for (const block of toolBlocks) {
        toolsUsed.push(block.name)
        const result = await executeTool(block.name, block.input, req.user.id)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
      }

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      })
      accumulateUsage(usageAcc, response)
    }

    const textContent = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    // Save assistant message
    await supabase.from('eo_chat_messages').insert({
      user_id: req.user.id,
      role: 'assistant',
      content: textContent,
      tool_data: toolsUsed.length ? { tools_used: toolsUsed } : null,
    })

    // Record AI usage + cost
    await recordUserAICall(req.user.id, { tools_used: toolsUsed })
    logExecution({
      userId: req.user.id,
      model: MODEL,
      inputTokens: usageAcc.inputTokens,
      outputTokens: usageAcc.outputTokens,
      skill: 'chat',
      metadata: { tools_used: toolsUsed, iterations: usageAcc.calls },
    })

    // Tao trace
    logTrace({
      type: 'chat',
      userId: req.user.id,
      input: message,
      output: textContent,
      model: MODEL,
      tools_used: toolsUsed,
    })

    res.json({ response: textContent, toolsUsed })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: 'Chat failed' })
  }
})

// Get chat history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eo_chat_messages')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// Delete chat history
router.delete('/history', requireAuth, async (req, res) => {
  try {
    await supabase
      .from('eo_chat_messages')
      .delete()
      .eq('user_id', req.user.id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history' })
  }
})

export default router
