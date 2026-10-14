import { useRef, useState } from 'react'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import Avatar from '../component/Avatar'
import { profileClient } from '../auth/profile'
import { createComment, deleteComment, deletePost, listComments, setPostLike, setPostSaved, setPostVisibility }
  from './client'
import PostGallery from './PostGallery'
import PostMenu from './PostMenu'
import { useAutoRefresh } from '../live/useAutoRefresh'
import { mergeNewestComments } from './merge-comments'

export default function PostCard({ post, user, onChange, onBusyChange, refreshing, refreshRevision, onOpenProfile,
  onSummarize, onDelete }) {
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
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
      <span className="avatar" aria-hidden="true"><Avatar user={user} userId={post.author_id} className="avatar-fill" /></span>
      <div>
        <button type="button" className="author-link" onClick={() => onOpenProfile(post.is_own ? null : post.author_id)}>
          {post.author_name}
        </button>
        <p>@{post.author_username} · {post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}</p>
      </div>
      {post.is_own ? <>
        <select className="post-visibility" aria-label="Who can see this post"
          disabled={busy || refreshing} value={post.visibility} onChange={event => {
            const visibility = event.target.value
            mutate(async () => onChange({ ...post, ...await setPostVisibility(user, post.id, visibility) }))
          }}>
          <option value="public">All members</option><option value="private">Only me</option>
        </select>
        {onDelete && <PostMenu disabled={busy || refreshing}
          onDelete={() => { setError(''); setConfirmingDelete(true) }} />}
      </> : post.author_following ? <span className="post-follow is-following">Following</span>
        : <button type="button" className="post-follow" disabled={busy || refreshing}
          aria-label={`Follow ${post.author_name}`} onClick={() => mutate(async () => {
            const summary = await profileClient.setFollow(user, post.author_id, true)
            onChange({ ...post, author_following: summary.following })
          })}>+ Follow</button>}
    </div>
    {confirmingDelete && (
      <div className="post-delete-confirm" role="alertdialog" aria-label="Delete post">
        <p>Delete this post? Its photos, likes and comments will be removed for everyone.</p>
        <div>
          <button type="button" className="post-delete-cancel" disabled={busy}
            onClick={() => setConfirmingDelete(false)}>Cancel</button>
          <button type="button" className="post-delete-yes" disabled={busy || refreshing}
            onClick={() => mutate(async () => {
              await deletePost(user, post.id)
              onDelete(post.id)
            })}>{busy ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    )}
    {post.content && <p className="post-text">{post.content}</p>}
    <PostGallery user={user} post={post} />
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
      <button className={`post-action-button post-save-button${post.saved ? ' is-saved' : ''}`} type="button"
        aria-pressed={Boolean(post.saved)} disabled={busy || loading || refreshing} onClick={() => mutate(async () =>
          onChange(await setPostSaved(user, post.id, !post.saved)))}>
        {post.saved ? <BookmarkIcon /> : <BookmarkBorderOutlinedIcon />} {post.saved ? 'Saved' : 'Save'}
      </button>
      {onSummarize && post.content?.trim() && (
        <button className="summarise-button" type="button" onClick={() => onSummarize(post.content)}>
          <AutoAwesomeIcon /> Summarise
        </button>
      )}
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
