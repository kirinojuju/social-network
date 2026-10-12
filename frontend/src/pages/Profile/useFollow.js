import { useEffect, useState } from 'react'
import { profileClient } from '../../auth/profile'

// Follower counts and whether the signed-in member follows `userId`.
export function useFollow(user, userId) {
  const [state, setState] = useState({ userId: null, summary: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    profileClient.getFollow(user, userId, { signal: controller.signal })
      .then(summary => setState({ userId, summary }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ userId, summary: null })
      })
    return () => controller.abort()
  }, [user, userId])

  const summary = state.userId === userId ? state.summary : null

  async function toggle() {
    if (busy || !summary) return
    setBusy(true)
    setError('')
    try {
      setState({ userId, summary: await profileClient.setFollow(user, userId, !summary.following) })
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return { summary, busy, error, toggle }
}
