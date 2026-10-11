import { useEffect, useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import Avatar from '../component/Avatar'
import { preparePhoto } from '../images/prepare'
import { createPost } from './client'
import './CreatePostDialog.css'

export default function CreatePostDialog({ user, profile, initialFile, onCreated, onClose }) {
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [image, setImage] = useState(null)
  const [preparing, setPreparing] = useState(Boolean(initialFile))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)
  const pick = useRef(0)

  async function choosePhoto(file) {
    const attempt = ++pick.current
    setPreparing(true)
    setError('')
    try {
      const prepared = await preparePhoto(file)
      if (attempt === pick.current) setImage(prepared)
    } catch (failure) {
      if (attempt === pick.current) setError(failure.message)
    } finally {
      if (attempt === pick.current) setPreparing(false)
    }
  }

  useEffect(() => {
    if (!initialFile) return
    let active = true
    const attempt = ++pick.current
    const current = () => active && attempt === pick.current
    preparePhoto(initialFile)
      .then(prepared => { if (current()) setImage(prepared) })
      .catch(failure => { if (current()) setError(failure.message) })
      .finally(() => { if (current()) setPreparing(false) })
    return () => { active = false }
  }, [initialFile])

  const isEmpty = !content.trim() && !image

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
      onCreated(await createPost(user, { content, visibility, image }))
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }

  const firstName = (profile?.display_name || '').split(' ')[0]

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

          <textarea className="create-post-text" value={content} maxLength={10000} rows={image ? 2 : 5} autoFocus
            disabled={busy} placeholder={firstName ? `What's on your mind, ${firstName}?` : "What's on your mind?"}
            onChange={event => setContent(event.target.value)} />

          {(image || preparing) && (
            <div className="create-post-preview">
              {image && <img src={`data:${image.mime_type};base64,${image.base64}`} alt="Selected photo preview" />}
              {preparing && <p role="status">Preparing photo…</p>}
              {image && !preparing && (
                <button type="button" className="create-post-preview-remove" aria-label="Remove photo" disabled={busy}
                  onClick={() => setImage(null)}>
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          <div className="create-post-add">
            <span>Add to your post</span>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={event => {
              const file = event.target.files[0]
              event.target.value = ''
              if (file) choosePhoto(file)
            }} />
            <button type="button" disabled={busy || preparing} onClick={() => fileInput.current?.click()}>
              <ImageOutlinedIcon /> {image ? 'Change photo' : 'Photo'}
            </button>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}
        </div>

        <button type="submit" className="create-post-submit" disabled={busy || preparing || isEmpty}>
          {busy ? 'Posting…' : 'Post'}
        </button>
      </form>
    </div>
  )
}
