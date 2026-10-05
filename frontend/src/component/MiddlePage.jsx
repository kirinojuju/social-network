import { useEffect, useRef, useState } from 'react'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { createPost, listPosts } from '../posts/client'
import PostImage from '../posts/PostImage'
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

export default function MiddlePage({ profile, user, onSummarize }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fileInput = useRef(null)

  useEffect(() => {
    let active = true
    listPosts(user).then(items => {
      if (active) setPosts(items)
    }).catch(failure => {
      if (active) setError(failure.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [user])

  async function submit(event) {
    event.preventDefault()
    if (busy || (!content.trim() && !file)) return
    setError('')
    if (file && (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('Choose a JPEG, PNG, WebP, or GIF image up to 5 MB.')
      return
    }
    setBusy(true)
    try {
      const image = file ? await readImage(file) : null
      const post = await createPost(user, { content, visibility: 'private', image })
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

  const visiblePosts = posts.filter(post => post.content.toLowerCase().includes(query.toLowerCase()))

  return (
    <main className="middle-page">
      <header className="topbar">
        <label className="search-box">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Search your posts..." aria-label="Search your posts" />
        </label>
        <div className="profile-icon" title={profile.display_name} aria-label={profile.display_name}>
          {profile.display_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </header>

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
            {file && <span className="selected-file">{file.name}</span>}
            <button className="post-button" disabled={busy || (!content.trim() && !file)} type="submit">
              {busy ? 'Posting…' : 'Post'}
            </button>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>

        <section aria-label="Your posts">
          <h2>Your posts</h2>
          {loading && <p role="status">Loading posts…</p>}
          {!loading && visiblePosts.length === 0 && <p>{query ? 'No matching posts.' : 'No posts yet.'}</p>}
          {visiblePosts.map(post => <article className="sample-post" key={post.id}>
            <div className="post-header">
              <div className="avatar" aria-hidden="true">👤</div>
              <div>
                <strong>{profile.display_name}</strong>
                <p>{post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}</p>
              </div>
            </div>
            {post.content && <p className="post-text">{post.content}</p>}
            {post.image_id && <PostImage user={user} id={post.image_id} />}
            {post.content && <div className="post-actions">
              <button className="summarise-button" type="button" onClick={() => onSummarize(post.content)}>
                ✦ Summarise preview
              </button>
            </div>}
          </article>)}
        </section>
      </section>
    </main>
  )
}
