import { useEffect, useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import Avatar from '../component/Avatar'
import { preparePhoto } from '../images/prepare'
import { createPost } from './client'
import './CreatePostDialog.css'

const maxPostPhotos = 10
let nextPhotoKey = 0

async function preparePhotos(files) {
  const results = await Promise.allSettled([...files].map(preparePhoto))
  return {
    photos: results.filter(result => result.status === 'fulfilled')
      .map(result => ({ ...result.value, key: ++nextPhotoKey })),
    error: results.find(result => result.status === 'rejected')?.reason?.message || '',
  }
}

export default function CreatePostDialog({ user, profile, initialFiles, onCreated, onClose }) {
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [photos, setPhotos] = useState([])
  const [preparing, setPreparing] = useState(initialFiles?.length ? 1 : 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)

  async function choosePhotos(files) {
    const room = maxPostPhotos - photos.length
    if (room <= 0) return
    setError('')
    setPreparing(count => count + 1)
    try {
      const result = await preparePhotos(files.slice(0, room))
      setPhotos(current => [...current, ...result.photos].slice(0, maxPostPhotos))
      setError(files.length > room ? `You can add up to ${maxPostPhotos} photos to a post.` : result.error)
    } finally {
      setPreparing(count => count - 1)
    }
  }

  useEffect(() => {
    if (!initialFiles?.length) return
    let active = true
    preparePhotos([...initialFiles].slice(0, maxPostPhotos)).then(result => {
      if (!active) return
      setPhotos(current => [...current, ...result.photos].slice(0, maxPostPhotos))
      setError(initialFiles.length > maxPostPhotos ? `You can add up to ${maxPostPhotos} photos to a post.` : result.error)
      setPreparing(count => count - 1)
    })
    return () => { active = false }
  }, [initialFiles])

  const isEmpty = !content.trim() && !photos.length

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onClose])

  async function submit(event) {
    event.preventDefault()
    if (busy || preparing || isEmpty) return
    setBusy(true)
    setError('')
    try {
      const images = photos.map(({ mime_type, base64 }) => ({ mime_type, base64 }))
      onCreated(await createPost(user, { content, visibility, images }))
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }

  const firstName = (profile?.display_name || '').split(' ')[0]
  const full = photos.length >= maxPostPhotos

  return (
    <div className="create-post-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy && isEmpty && !preparing) onClose()
    }}>
      <form className="create-post-dialog" role="dialog" aria-modal="true" aria-labelledby="create-post-title"
        onSubmit={submit}>
        <header className="create-post-dialog-header">
          <h2 id="create-post-title">Create post</h2>
          <button type="button" className="create-post-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="create-post-dialog-body">
          <div className="create-post-author">
            <Avatar user={user} userId={profile?.id} className="create-post-author-avatar" />
            <div>
              <strong>{profile?.display_name || 'You'}</strong>
              <select aria-label="Audience" value={visibility} disabled={busy}
                onChange={event => setVisibility(event.target.value)}>
                <option value="public">All members</option>
                <option value="private">Only me</option>
              </select>
            </div>
          </div>

          <textarea className="create-post-text" value={content} maxLength={10000} rows={photos.length ? 2 : 5} autoFocus
            disabled={busy} placeholder={firstName ? `What's on your mind, ${firstName}?` : "What's on your mind?"}
            onChange={event => setContent(event.target.value)} />

          {(photos.length > 0 || preparing > 0) && (
            <div className={`create-post-photos${photos.length === 1 ? ' single' : ''}`}>
              {photos.map((photo, index) => (
                <div className="create-post-photo" key={photo.key}>
                  <img src={`data:${photo.mime_type};base64,${photo.base64}`} alt={`Selected photo ${index + 1}`} />
                  <button type="button" className="create-post-photo-remove" aria-label={`Remove photo ${index + 1}`}
                    disabled={busy} onClick={() => setPhotos(current => current.filter(item => item.key !== photo.key))}>
                    <CloseIcon />
                  </button>
                </div>
              ))}
              {preparing > 0 && <p className="create-post-photo-status" role="status">Preparing photos…</p>}
              {photos.length > 0 && !full && !preparing && (
                <button type="button" className="create-post-photo-add" disabled={busy}
                  onClick={() => fileInput.current?.click()}>
                  <AddPhotoAlternateOutlinedIcon />
                  <span>Add more</span>
                </button>
              )}
            </div>
          )}

          <div className="create-post-add">
            <span>{photos.length ? `${photos.length} / ${maxPostPhotos} photos` : 'Add to your post'}</span>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={event => {
              const files = [...event.target.files]
              event.target.value = ''
              if (files.length) choosePhotos(files)
            }} />
            <button type="button" disabled={busy || preparing > 0 || full} onClick={() => fileInput.current?.click()}>
              <ImageOutlinedIcon /> {photos.length ? 'Add photos' : 'Photos'}
            </button>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}
        </div>

        <button type="submit" className="create-post-submit" disabled={busy || preparing > 0 || isEmpty}>
          {busy ? 'Posting…' : 'Post'}
        </button>
      </form>
    </div>
  )
}
