import { useEffect, useState } from 'react'
import { createPost, listPosts } from '../posts/client'
import PostImage from '../posts/PostImage'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.onload = () => resolve({ mime_type: file.type, base64: String(reader.result).split(',')[1] })
    reader.readAsDataURL(file)
  })
}

export default function Homepage({ profile, user }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listPosts(user).then(items => { if (active) setPosts(items) })
      .catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [user])

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
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
      form.reset()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="home-content">
      <h2>Welcome to CMU Connect</h2>
      <p>Signed in as {profile.display_name} (@{profile.username})</p>
      <form className="post-form" onSubmit={submit}>
        <label htmlFor="post-content">New post</label>
        <textarea id="post-content" value={content} onChange={event => setContent(event.target.value)}
          maxLength={10000} rows={4} placeholder="What would you like to share?" />
        <label htmlFor="post-image">Photo (optional, up to 2 MB)</label>
        <input id="post-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={event => setFile(event.target.files[0] || null)} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn" disabled={busy || (!content.trim() && !file)} type="submit">
          {busy ? 'Posting…' : 'Post'}
        </button>
      </form>
      <h3>Your posts</h3>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map(post => <article className="post-card" key={post.id}>
        <p>{post.content}</p>
        {post.image_id && <PostImage user={user} id={post.image_id} />}
        <small>{new Date(post.created_at).toLocaleString()}</small>
      </article>)}
    </div>
  )
}
