import { useCallback, useState } from 'react'
import PostImage from './PostImage'
import PhotoViewer from './PhotoViewer'
import { postImageIds } from './images'
import './PostGallery.css'

const shownTiles = 4

export default function PostGallery({ user, post }) {
  const ids = postImageIds(post)
  const [open, setOpen] = useState(null)
  const close = useCallback(() => setOpen(null), [])
  if (!ids.length) return null

  const tiles = ids.slice(0, shownTiles)
  const hidden = ids.length - tiles.length

  return (
    <>
      <div className={`post-gallery count-${Math.min(ids.length, shownTiles)}`}>
        {tiles.map((id, index) => (
          <button type="button" key={id} className="post-gallery-tile"
            aria-label={`Open photo ${index + 1} of ${ids.length}`} onClick={() => setOpen(index)}>
            <PostImage user={user} id={id} className="post-gallery-image" alt="" />
            {hidden > 0 && index === tiles.length - 1 && <span className="post-gallery-more">+{hidden}</span>}
          </button>
        ))}
      </div>
      {open !== null && (
        <PhotoViewer user={user} startIndex={open} onClose={close}
          photos={ids.map(id => ({ id, caption: post.content }))} />
      )}
    </>
  )
}
