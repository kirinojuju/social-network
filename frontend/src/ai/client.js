export function aiBaseUrl(env = {}) {
  return (env.VITE_API_BASE_URL || (env.DEV ? 'http://127.0.0.1:3000' : '')).replace(/\/$/, '')
}

export function createAiClient({ baseUrl = aiBaseUrl(import.meta.env), fetchImpl = fetch } = {}) {
  const root = baseUrl.replace(/\/$/, '')
  async function request(user, path, body) {
    const token = await user.getIdToken()
    let response
    try {
      response = await fetchImpl(`${root}/api/ai/${path}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      throw new Error('Cannot reach the backend. Check that the server is running.')
    }
    if (response.status === 401) throw new Error('Your session expired. Sign out and sign in again.')
    if (!response.ok) throw new Error('UniAI could not answer. Please try again.')
    return response.json()
  }
  return {
    summarizePost: async (user, text) => (await request(user, 'summarize', { text })).summary,
    // Keep the latest turns within the backend's 20-message limit.
    chatWithAI: async (user, messages, context = '') =>
      (await request(user, 'chat', { messages: messages.slice(-19), context })).reply,
  }
}

export const { summarizePost, chatWithAI } = createAiClient()
