import { useEffect, useState } from 'react'
import { profileClient } from '../../auth/profile'

// Loads a member's profile photo as an object URL; `version` forces a reload after changes.
export function useAvatar(user, userId, version) {
  const [avatar, setAvatar] = useState({ key: null, url: null })
  const key = userId ? `${userId}:${version}` : null

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    let objectUrl = null
    profileClient.loadAvatar(user, userId, { signal: controller.signal }).then(blob => {
      if (controller.signal.aborted) return
      objectUrl = blob ? URL.createObjectURL(blob) : null
      setAvatar({ key: `${userId}:${version}`, url: objectUrl })
    }).catch(() => {
      if (!controller.signal.aborted) setAvatar({ key: `${userId}:${version}`, url: null })
    })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [user, userId, version])

  return avatar.key === key ? avatar.url : null
}
