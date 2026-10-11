import { useEffect, useRef, useState } from 'react'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { listPosts } from '../posts/client'
import PostCard from '../posts/PostCard'
import CreatePostDialog from '../posts/CreatePostDialog'
import Avatar from './Avatar'
import MemberDirectory from './MemberDirectory'
import { useAutoRefresh } from '../live/useAutoRefresh'
import './MiddlePage.css'

export default function MiddlePage({ user, profile, composer, onOpenComposer, onCloseComposer,
  people, peopleLoading, peopleError, onRefreshPeople, onOpenProfile }) {
  const [posts, setPosts] = useState([])
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
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
    if (loading || mutations.current.size) return
    const version = feedVersion.current
    const items = await listPosts(user, { signal })
    if (!signal.aborted && version === feedVersion.current && !mutations.current.size) {
      setPosts(items)
      setFeedError('')
    }
  }, 10000)

  function addCreatedPost(post) {
    feedVersion.current++
    setPosts(items => [post, ...items.filter(item => item.id !== post.id)])
    onCloseComposer()
  }

  async function refresh() {
    if (loading || mutations.current.size) return
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
        <section className="create-post-card" aria-label="Create a post">
          <div className="create-post-top">
            <Avatar user={user} userId={profile?.id} className="create-post-card-avatar" />
            <button type="button" className="create-post-prompt" onClick={() => onOpenComposer()}>
              {profile?.display_name ? `What's on your mind, ${profile.display_name.split(' ')[0]}?` : "What's on your mind?"}
            </button>
          </div>
          <div className="post-divider" />
          <div className="post-tools">
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={event => {
              const file = event.target.files[0]
              event.target.value = ''
              if (file) onOpenComposer(file)
            }} />
            <button type="button" className="tool-button" onClick={() => fileInput.current?.click()}>
              <ImageOutlinedIcon /> Photo
            </button>
            <button type="button" className="post-button" onClick={() => onOpenComposer()}>Create post</button>
          </div>
        </section>
        {composer && (
          <CreatePostDialog user={user} profile={profile} initialFile={composer.file}
            onCreated={addCreatedPost} onClose={onCloseComposer} />
        )}
        <MemberDirectory people={people} loading={peopleLoading} error={peopleError} onRefresh={onRefreshPeople}
          onOpenProfile={onOpenProfile} />
        <section aria-label="Community feed">
          <div className="feed-heading"><h2>Community feed</h2>
            <button className="tool-button" type="button" disabled={loading} onClick={() => refresh()}>Refresh</button>
          </div>
          {feedError && <p className="auth-error" role="alert">{feedError}</p>}
          {loading && <p role="status">Loading posts…</p>}
          {!loading && posts.length === 0 && <p>No posts yet.</p>}
          {posts.map(post => <PostCard post={post} user={user} key={`${user.uid}:${post.id}`}
            refreshing={loading} refreshRevision={revision} onOpenProfile={onOpenProfile}
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
