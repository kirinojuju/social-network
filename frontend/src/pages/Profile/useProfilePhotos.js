import { useEffect, useState } from 'react'
import { listPosts } from '../../posts/client'

// Posts with a photo from the member's latest posts that the viewer is allowed to see.
export function useProfilePhotos(user, profileId) {
  const [state, setState] = useState({ id: null, photos: [], error: '' })

  useEffect(() => {
    if (!profileId) return
    let active = true
    listPosts(user, { author: profileId })
      .then(posts => {
        if (active) setState({ id: profileId, photos: posts.filter(post => post.image_id), error: '' })
      })
      .catch(() => {
        if (active) setState({ id: profileId, photos: [], error: 'Could not load photos. Try again later.' })
      })
    return () => { active = false }
  }, [user, profileId])

  return { loading: state.id !== profileId, photos: state.photos, error: state.error }
}
