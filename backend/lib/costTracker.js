import { supabase } from '../supabase.js'

const APP_NAME = 'emotion-orchard'

const MODEL_PRICING = {
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  'claude-sonnet-4-5-20250514': { input: 3.00, output: 15.00 },
  'claude-opus-4-5-20250514': { input: 15.00, output: 75.00 },
}

export function computeCost(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model] || { input: 1.0, output: 5.0 }
  return ((inputTokens * pricing.input) + (outputTokens * pricing.output)) / 1_000_000
}

export function extractUsage(response) {
  return {
    inputTokens: response?.usage?.input_tokens || 0,
    outputTokens: response?.usage?.output_tokens || 0,
  }
}

export function createUsageAccumulator() {
  return { inputTokens: 0, outputTokens: 0, calls: 0 }
}

export function accumulateUsage(acc, response) {
  const usage = extractUsage(response)
  acc.inputTokens += usage.inputTokens
  acc.outputTokens += usage.outputTokens
  acc.calls += 1
  return acc
}

export function logExecution({ userId, model, inputTokens, outputTokens, skill, metadata }) {
  const cost = computeCost(model, inputTokens, outputTokens)

  supabase.from('tc_skill_executions').insert({
    user_id: userId,
    app: APP_NAME,
    skill: skill || 'chat',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost: cost,
    metadata: metadata || {},
  }).then(({ error }) => {
    if (error) console.error('Cost tracking error:', error)
  }).catch(() => {})
}
