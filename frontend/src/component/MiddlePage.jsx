import { useEffect, useRef, useState } from 'react'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { changePostVisibility, createPost, listPosts, listPublicPosts } from '../posts/client'
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

export default function MiddlePage({ profile, user, people, onSummarize }) {
  const [ownPosts, setOwnPosts] = useState([])
  const [publicPosts, setPublicPosts] = useState([])
  const [view, setView] = useState('community')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [changingId, setChangingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fileInput = useRef(null)

  useEffect(() => {
    let active = true
    listPosts(user).then(async owned => [owned, await listPublicPosts()]).then(([owned, shared]) => {
      if (!active) return
      setOwnPosts(owned)
      setPublicPosts(shared)
    }).catch(failure => {
      if (active) setError(failure.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [user])

  async function refreshPosts() {
    setLoading(true)
    setError('')
    try {
      const owned = await listPosts(user)
      const shared = await listPublicPosts()
      setOwnPosts(owned)
      setPublicPosts(shared)
    } catch (failure) { setError(failure.message) }
    finally { setLoading(false) }
  }

  async function submit(event) {
    event.preventDefault()
    if (busy || (!content.trim() && !file)) return
    setError('')
    if (file && (!allowedTypes.includes(file.type) || file.size > 2 * 1024 * 1024)) {
      setError('Choose a JPEG, PNG, WebP, or GIF image up to 2 MB.')
      return
    }
    setBusy(true)
    try {
      const image = file ? await readImage(file) : null
      const post = await createPost(user, { content, visibility, image })
      setOwnPosts(items => [post, ...items])
      if (post.visibility === 'public') setPublicPosts(items => [post, ...items])
      setContent('')
      setVisibility('private')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }

  async function toggleVisibility(post) {
    const next = post.visibility === 'public' ? 'private' : 'public'
    setChangingId(post.id)
    setError('')
    try {
      const updated = await changePostVisibility(user, post, next)
      setOwnPosts(items => items.map(item => item.id === post.id ? updated : item))
      setPublicPosts(items => next === 'public'
        ? [updated, ...items.filter(item => item.id !== post.id)]
        : items.filter(item => item.id !== post.id))
    } catch (failure) { setError(failure.message) }
    finally { setChangingId(null) }
  }

  const members = new Map(people.map(person => [person.uid, person]))
  members.set(user.uid, { display_name: profile.display_name, username: profile.username })
  const posts = view === 'community' ? publicPosts : ownPosts
  const visiblePosts = posts.filter(post => {
    const name = members.get(post.author_uid)?.display_name || ''
    return `${post.content || ''} ${name}`.toLowerCase().includes(query.toLowerCase())
  })

  return <main className="middle-page">
    <header className="topbar">
      <label className="search-box">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Search posts..." aria-label="Search posts" />
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
          <label className="visibility-picker">Who can see this?
            <select value={visibility} onChange={event => setVisibility(event.target.value)}>
              <option value="private">Only me</option>
              <option value="public">Everyone signed in</option>
            </select>
          </label>
          <button className="post-button" disabled={busy || (!content.trim() && !file)} type="submit">
            {busy ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      <section aria-label="Posts">
        <div className="feed-heading">
          <div className="feed-tabs" role="group" aria-label="Post feed">
            <button type="button" aria-pressed={view === 'community'}
              onClick={() => setView('community')}>Community posts</button>
            <button type="button" aria-pressed={view === 'mine'}
              onClick={() => setView('mine')}>My posts</button>
          </div>
          <button type="button" className="feed-refresh" onClick={refreshPosts} disabled={loading}>Refresh</button>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {loading && <p role="status">Loading posts…</p>}
        {!loading && visiblePosts.length === 0 && <p>{query ? 'No matching posts.'
          : view === 'community' ? 'No shared posts yet. Share one of your posts from My posts.'
            : 'No posts yet.'}</p>}
        {visiblePosts.map(post => {
          const author = members.get(post.author_uid)
          const isMine = post.author_uid === user.uid
          return <article className="sample-post" key={post.id}>
            <div className="post-header">
              <div className="avatar" aria-hidden="true">👤</div>
              <div>
                <strong>{author?.display_name || 'Member'}</strong>
                <p>{author?.username ? `@${author.username} · ` : ''}
                  {post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}</p>
              </div>
              {isMine && <span className="post-visibility">{post.visibility === 'public' ? 'Shared' : 'Only me'}</span>}
            </div>
            {post.content && <p className="post-text">{post.content}</p>}
            {post.image_id && <PostImage user={user} id={post.image_id} />}
            <div className="post-actions">
              {isMine && <button className="visibility-action" type="button"
                disabled={changingId === post.id} onClick={() => toggleVisibility(post)}>
                {changingId === post.id ? 'Saving…' : post.visibility === 'public' ? 'Make private' : 'Share with community'}
              </button>}
              {post.content && <button className="summarise-button" type="button"
                onClick={() => onSummarize(post.content)}>✦ Summarise preview</button>}
            </div>
          </article>
        })}
      </section>
    </section>
  </main>
}
