import { useEffect, useState } from 'react'
import { listPosts } from './client'
import PostCard from './PostCard'
import { applyPostUpdate } from './apply-update'
import '../component/MiddlePage.css'
import './PostList.css'

// One member's posts (`author`) or the signed-in member's saved posts (`scope="saved"`).
export default function PostList({ user, author, scope, title, emptyText, onOpenProfile }) {
  const source = author ? `author:${author}` : scope
  const [state, setState] = useState({ source: null, posts: [], error: '' })

  useEffect(() => {
    let active = true
    listPosts(user, author ? { author } : { scope })
      .then(posts => { if (active) setState({ source, posts, error: '' }) })
      .catch(() => { if (active) setState({ source, posts: [], error: 'Could not load posts. Try again later.' }) })
    return () => { active = false }
  }, [user, author, scope, source])

  const loading = state.source !== source

  return (
    <section className="post-list" aria-label={title}>
      <h2>{title}</h2>
      {loading && <p role="status">Loading posts…</p>}
      {!loading && state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {!loading && !state.error && state.posts.length === 0 && <p className="post-list-empty">{emptyText}</p>}
      {!loading && state.posts.map(post => (
        <PostCard key={post.id} post={post} user={user} refreshing={false} refreshRevision={0}
          onOpenProfile={onOpenProfile} onBusyChange={() => {}}
          onChange={updated => setState(current => ({ ...current, posts: applyPostUpdate(current.posts, updated) }))} />
      ))}
    </section>
  )
}
