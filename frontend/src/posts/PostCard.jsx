import { useRef, useState } from 'react'
import { createComment, deleteComment, listComments, setPostLike, setPostVisibility } from './client'
import PostImage from './PostImage'
import { useAutoRefresh } from '../live/useAutoRefresh'
import { mergeNewestComments } from './merge-comments'

export default function PostCard({ post, user, onChange, onBusyChange, refreshing, refreshRevision }) {
  const [busy, setBusy] = useState(false)
  const [comments, setComments] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const activity = useRef(false)
  const commentVersion = useRef(0)
  const olderLoaded = useRef(false)

  useAutoRefresh(async signal => {
    if (activity.current) return
    const version = commentVersion.current
    const result = await listComments(user, post.id, null, { signal })
    if (signal.aborted || activity.current || version !== commentVersion.current) return
    setComments(items => olderLoaded.current ? mergeNewestComments(items, result.comments) : result.comments)
    if (!olderLoaded.current) setNextCursor(result.next_cursor)
  }, 5000, open && !refreshing, refreshRevision)

  async function mutate(action) {
    if (activity.current || refreshing) return
    activity.current = true
    commentVersion.current++
    onBusyChange(true)
    setBusy(true)
    setError('')
    try { await action() } catch (failure) { setError(failure.message) }
    finally {
      activity.current = false
      commentVersion.current++
      onBusyChange(false)
      setBusy(false)
    }
  }

  async function load(older = false) {
    if (activity.current || refreshing) return
    activity.current = true
    commentVersion.current++
    setLoading(true)
    setError('')
    try {
      const result = await listComments(user, post.id, older ? nextCursor : null)
      olderLoaded.current = older
      setComments(items => older ? [...items, ...result.comments] : result.comments)
      setNextCursor(result.next_cursor)
    } catch (failure) { setError(failure.message) }
    finally { activity.current = false; setLoading(false) }
  }

  async function submit(event) {
    event.preventDefault()
    if (!content.trim() || loading) return
    await mutate(async () => {
      const comment = await createComment(user, post.id, content)
      setComments(items => [comment, ...items])
      setContent('')
      onChange({ ...post, comment_count: post.comment_count + 1 })
    })
  }

  return <article className="sample-post" aria-label={`Post by ${post.author_name}`}>
    <div className="post-header">
      <div className="avatar" aria-hidden="true">👤</div>
      <div>
        <strong>{post.author_name}</strong>
        <p>@{post.author_username} · {post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}</p>
      </div>
      {post.is_own ? <select className="post-visibility" aria-label="Who can see this post"
        disabled={busy || refreshing} value={post.visibility} onChange={event => {
          const visibility = event.target.value
          mutate(async () => onChange({ ...post, ...await setPostVisibility(user, post.id, visibility) }))
        }}>
        <option value="public">All members</option><option value="private">Only me</option>
      </select> : <span className="post-visibility">All members</span>}
    </div>
    {post.content && <p className="post-text">{post.content}</p>}
    {post.image_id && <PostImage user={user} id={post.image_id} />}
    <div className="post-actions">
      <button className={`post-action-button${post.liked ? ' is-liked' : ''}`} type="button"
        aria-pressed={post.liked} disabled={busy || loading || refreshing} onClick={() => mutate(async () =>
          onChange(await setPostLike(user, post.id, !post.liked)))}>
        {post.liked ? '♥ Liked' : '♡ Like'} ({post.like_count})
      </button>
      <button className="post-action-button" type="button" aria-expanded={open} disabled={busy || loading || refreshing}
        onClick={() => { setOpen(!open); if (!open) load() }}>
        Comments ({post.comment_count})
      </button>
    </div>
    {open && <section className="post-comments" aria-label="Comments">
      {nextCursor && <button type="button" disabled={loading || busy || refreshing} onClick={() => load(true)}>Load older comments</button>}
      {[...comments].reverse().map(comment => <div className="post-comment" key={comment.id}>
        <div><strong>{comment.author_name}</strong> <span>@{comment.author_username}</span>
          <p>{comment.content}</p>
          <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString()}</time>
        </div>
        {comment.is_own && <button type="button" disabled={busy || loading || refreshing} aria-label="Delete your comment"
          onClick={() => mutate(async () => {
            await deleteComment(user, post.id, comment.id)
            setComments(items => items.filter(item => item.id !== comment.id))
            onChange({ ...post, comment_count: Math.max(0, post.comment_count - 1) })
          })}>Delete</button>}
      </div>)}
      {loading && <p role="status">Loading comments…</p>}
      {!loading && comments.length === 0 && <p>No comments yet.</p>}
      <form className="comment-form" onSubmit={submit}>
        <textarea aria-label="Write a comment" placeholder="Write a comment…" rows={2}
          maxLength={2000} value={content} onChange={event => setContent(event.target.value)} />
        <button className="tool-button" type="submit" disabled={busy || loading || refreshing || !content.trim()}>Send</button>
      </form>
    </section>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </article>
}
