const defaultBaseUrl = import.meta.env?.DEV ? 'http://127.0.0.1:3000' : ''
const root = (import.meta.env?.VITE_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '')

export async function search(user, query, { signal } = {}) {
  const token = await user.getIdToken()
  let response
  try {
    response = await fetch(`${root}/api/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store', signal, headers: { Authorization: `Bearer ${token}` },
    })
  } catch (failure) {
    if (failure.name === 'AbortError') throw failure
    throw new Error('Cannot reach the backend. Check that the server is running.')
  }
  if (response.status === 401) throw new Error('Your session expired. Sign out and sign in again.')
  if (!response.ok) throw new Error('Search failed. Please try again.')
  const data = await response.json()
  return {
    users: Array.isArray(data?.users) ? data.users : [],
    posts: Array.isArray(data?.posts) ? data.posts : [],
  }
}
