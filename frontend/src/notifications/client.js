const defaultBaseUrl = import.meta.env?.DEV ? 'http://127.0.0.1:3000' : ''
const root = (import.meta.env?.VITE_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '')

export async function listNotifications(user, { signal } = {}) {
  const token = await user.getIdToken()
  const response = await fetch(`${root}/api/notifications`, {
    signal, cache: 'no-store', headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Notifications are unavailable right now.')
  return (await response.json()).notifications
}
