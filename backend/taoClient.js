const TAO_API_URL = process.env.TAO_API_URL || 'https://api.taodata.ai'
const APP_TAG = 'emotion-orchard'

export function logTrace(traceData) {
  if (!TAO_API_URL) return

  const payload = {
    ...traceData,
    tags: [...(traceData.tags || []), `app:${APP_TAG}`],
    timestamp: new Date().toISOString(),
  }

  fetch(`${TAO_API_URL}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

export function registerPrompt(promptData) {
  if (!TAO_API_URL) return

  fetch(`${TAO_API_URL}/prompts/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...promptData,
      app: APP_TAG,
    }),
  }).catch(() => {})
}
