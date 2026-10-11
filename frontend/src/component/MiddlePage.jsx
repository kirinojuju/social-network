import { useEffect, useRef, useState } from 'react'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { createPost, listPosts } from '../posts/client'
import PostCard from '../posts/PostCard'
import MemberDirectory from './MemberDirectory'
import { useAutoRefresh } from '../live/useAutoRefresh'
import './MiddlePage.css'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.onload = () => resolve({ mime_type: file.type, base64: String(reader.result).split(',')[1] })
    reader.readAsDataURL(file)
  })
}

export default function MiddlePage({ user, people, peopleLoading, peopleError, onRefreshPeople }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [visibility, setVisibility] = useState('public')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedError, setFeedError] = useState('')
  const fileInput = useRef(null)
  const feedVersion = useRef(0)
  const mutations = useRef(new Set())

  useEffect(() => {
    let active = true
    listPosts(user).then(items => {
      if (active) setPosts(items)
    }).catch(failure => {
      if (active) setFeedError(failure.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [user])

  useAutoRefresh(async signal => {
    if (busy || loading || mutations.current.size) return
    const version = feedVersion.current
    const items = await listPosts(user, { signal })
    if (!signal.aborted && version === feedVersion.current && !mutations.current.size) {
      setPosts(items)
      setFeedError('')
    }
  }, 10000)

  async function submit(event) {
    event.preventDefault()
    if (busy || (!content.trim() && !file)) return
    setError('')
    if (file && (!allowedTypes.includes(file.type) || file.size > 2 * 1024 * 1024)) {
      setError('Choose a JPEG, PNG, WebP, or GIF image up to 2 MB.')
      return
    }
    setBusy(true)
    feedVersion.current++
    try {
      const image = file ? await readImage(file) : null
      const post = await createPost(user, { content, visibility, image })
      feedVersion.current++
      setPosts(items => [post, ...items])
      setContent('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function refresh() {
    if (busy || loading || mutations.current.size) return
    setLoading(true)
    setFeedError('')

    try {
      setPosts(await listPosts(user))
      setRevision(value => value + 1)
    } catch (failure) { setFeedError(failure.message) }
    finally { setLoading(false) }
  }

  return (
    <main className="middle-page">

      <section className="feed-content">
        <form className="create-post-card" onSubmit={submit}>
          <div className="create-post-top">
            <div className="avatar" aria-hidden="true">👤</div>
            <textarea id="post-content" value={content} maxLength={10000} rows={3}
              onChange={event => setContent(event.target.value)} placeholder="Create a post..." />
          </div>
          <div className="post-divider" />
          <div className="post-tools">
            <input ref={fileInput} type="file" id="post-image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={event => setFile(event.target.files[0] || null)} />
            <label className="tool-button" htmlFor="post-image"><PhotoCameraOutlinedIcon /> Photo</label>
            <label className="audience-label">Audience
              <select value={visibility} onChange={event => setVisibility(event.target.value)} disabled={busy}>
                <option value="public">All members</option><option value="private">Only me</option>
              </select>
            </label>
            {file && <span className="selected-file">{file.name}</span>}
            <button className="post-button" disabled={busy || (!content.trim() && !file)} type="submit">
              {busy ? 'Posting…' : 'Post'}
            </button>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
        <MemberDirectory people={people} loading={peopleLoading} error={peopleError} onRefresh={onRefreshPeople} />
        <section aria-label="Community feed">
          <div className="feed-heading"><h2>Community feed</h2>
            <button className="tool-button" type="button" disabled={loading || busy} onClick={() => refresh()}>Refresh</button>
          </div>
          {feedError && <p className="auth-error" role="alert">{feedError}</p>}
          {loading && <p role="status">Loading posts…</p>}
          {!loading && posts.length === 0 && <p>No posts yet.</p>}
          {posts.map(post => <PostCard post={post} user={user} key={`${user.uid}:${post.id}`}
            refreshing={loading} refreshRevision={revision}
            onBusyChange={isBusy => {
              feedVersion.current++
              if (isBusy) mutations.current.add(post.id)
              else mutations.current.delete(post.id)
            }}
            onChange={updated => {
              feedVersion.current++
              setPosts(items => items.map(item => item.id === updated.id ? updated : item))
            }} />)}
        </section>
      </section>
    </main>
  )
}
