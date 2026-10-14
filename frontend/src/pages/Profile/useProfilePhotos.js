import { useEffect, useState } from 'react'
import { listPosts } from '../../posts/client'
import { postImageIds } from '../../posts/images'

// Every photo, newest post first, from the member's latest posts that the viewer is allowed to see.
export function useProfilePhotos(user, profileId, version = 0) {
  const [state, setState] = useState({ id: null, photos: [], error: '' })

  useEffect(() => {
    if (!profileId) return
    let active = true
    listPosts(user, { author: profileId })
      .then(posts => {
        const photos = posts.flatMap(post => postImageIds(post).map(id => ({ id, caption: post.content })))
        if (active) setState({ id: profileId, photos, error: '' })
      })
      .catch(() => {
        if (active) setState({ id: profileId, photos: [], error: 'Could not load photos. Try again later.' })
      })
    return () => { active = false }
  }, [user, profileId, version])

  return { loading: state.id !== profileId, photos: state.photos, error: state.error }
}
