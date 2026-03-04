import { supabase } from '../supabase.js'

const APP_NAME = 'emotion-orchard'

export async function canUserMakeAICall(userId) {
  try {
    const { data, error } = await supabase.rpc('can_user_make_ai_call', {
      p_user_id: userId,
      p_app_name: APP_NAME,
    })
    if (error) {
      console.error('AI usage check error:', error)
      return true // fail open
    }
    return data
  } catch {
    return true
  }
}

export async function recordUserAICall(userId, metadata = {}) {
  try {
    await supabase.rpc('record_user_ai_call', {
      p_user_id: userId,
      p_app_name: APP_NAME,
      p_metadata: metadata,
    })
  } catch (err) {
    console.error('Failed to record AI call:', err)
  }
}
