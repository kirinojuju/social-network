const root = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')

export async function summarizePost(user, text) {
  const token = await user.getIdToken()
  let response
  try {
    response = await fetch(`${root}/api/ai/summarize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    throw new Error('Cannot reach the backend. Check that the server is running.')
  }
  if (response.status === 401) throw new Error('Your session expired. Sign out and sign in again.')
  if (!response.ok) throw new Error('The AI could not summarize this post. Please try again.')
  return (await response.json()).summary
}

export async function chatWithAI(user, messages, context) {
  const token = await user.getIdToken()
  let response
  try {
    response = await fetch(`${root}/api/ai/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    })
  } catch {
    throw new Error('Cannot reach the backend. Check that the server is running.')
  }
  if (response.status === 401) throw new Error('Your session expired. Sign out and sign in again.')
  if (!response.ok) throw new Error('UniAI could not answer. Please try again.')
  return (await response.json()).reply
}
