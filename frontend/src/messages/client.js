const defaultBaseUrl = import.meta.env?.DEV ? 'http://127.0.0.1:3000' : ''
const root = (import.meta.env?.VITE_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '')

async function request(user, path, { method = 'GET', body, signal } = {}) {
  const token = await user.getIdToken()
  let response
  try {
    response = await fetch(`${root}/api/messages${path}`, {
      method, signal, cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch (failure) {
    if (failure.name === 'AbortError') throw failure
    throw new Error('Cannot reach the backend. Check that the server is running.')
  }
  if (response.status === 401) throw new Error('Your session expired. Sign out and sign in again.')
  if (!response.ok) throw new Error(method === 'GET' ? 'Messages are unavailable right now.' : 'Message not sent. Please try again.')
  return response.status === 204 ? null : response.json()
}

const conversationPath = id => `/with/${encodeURIComponent(id)}`

export const listConversations = async (user, { signal } = {}) =>
  (await request(user, '/conversations', { signal })).conversations
export const listMessages = (user, id, before = null, { signal } = {}) =>
  request(user, `${conversationPath(id)}${before ? `?before=${encodeURIComponent(before)}` : ''}`, { signal })
export const sendMessage = async (user, id, { content, image = null }) =>
  (await request(user, conversationPath(id), { method: 'POST', body: { content, ...(image ? { image } : {}) } })).message

export async function loadMessageImage(user, messageId, { signal } = {}) {
  const token = await user.getIdToken()
  const response = await fetch(`${root}/api/messages/images/${encodeURIComponent(messageId)}`,
    { signal, headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('Photo unavailable.')
  return response.blob()
}
export const markConversationRead = (user, id) =>
  request(user, `${conversationPath(id)}/read`, { method: 'PUT' })
