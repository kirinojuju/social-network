import { useEffect, useState } from 'react'
import { loadPostImage } from './client'

export default function PostImage({ user, id }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let active = true
    let objectUrl
    loadPostImage(user, id).then(blob => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(() => {})
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [user, id])
  return url ? <img className="post-image" src={url} alt="Post attachment" /> : null
}
