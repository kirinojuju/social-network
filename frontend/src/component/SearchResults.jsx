import { useEffect, useState } from 'react'
import { search } from '../search/client'
import Avatar from './Avatar'
import './MiddlePage.css'
import './SearchResults.css'

export default function SearchResults({ user, query, onOpenProfile }) {
  const term = query.trim()
  const [attempt, setAttempt] = useState(0)
  const [results, setResults] = useState({ term: '', attempt: -1, users: [], posts: [], error: '' })
  const loading = results.term !== term || results.attempt !== attempt

  useEffect(() => {
    const controller = new AbortController()
    search(user, term, { signal: controller.signal })
      .then(found => {
        if (!controller.signal.aborted) setResults({ term, attempt, ...found, error: '' })
      })
      .catch(failure => {
        if (!controller.signal.aborted) setResults({ term, attempt, users: [], posts: [], error: failure.message })
      })
    return () => controller.abort()
  }, [user, term, attempt])

  const empty = !loading && !results.error && !results.users.length && !results.posts.length

  return (
    <main className="middle-page">
      <section className="feed-content search-page" aria-live="polite">
        <h2>Search results for “{term}”</h2>

        {loading && <p role="status">Searching…</p>}
        {!loading && results.error && <div role="alert">
          <p className="auth-error">{results.error}</p>
          <button type="button" className="tool-button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
        </div>}
        {empty && <p className="search-empty">No results found</p>}

        {!loading && results.users.length > 0 && (
          <section className="member-directory" aria-label="People">
            <h2>People</h2>
            <ul className="member-list">
              {results.users.map(person => (
                <li key={person.id}>
                  <button type="button" className="member-link"
                    onClick={() => onOpenProfile(person.is_self ? null : person.id)}>
                    <span className="member-initial" aria-hidden="true">{person.display_name?.slice(0, 1)}</span>
                    <div>
                      <strong>
                        {person.display_name}
                        {person.is_self && <em className="search-badge">You</em>}
                      </strong>
                      <span>@{person.username}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && results.posts.length > 0 && (
          <section className="member-directory" aria-label="Posts">
            <h2>Posts</h2>
            {results.posts.map(post => (
              <article className="sample-post" key={post.id} aria-label={`Post by ${post.author_name}`}>
                <div className="post-header">
                  <span className="avatar" aria-hidden="true">
                    <Avatar user={user} userId={post.author_id} className="avatar-fill" />
                  </span>
                  <div>
                    <button type="button" className="author-link"
                      onClick={() => onOpenProfile(post.is_own ? null : post.author_id)}>
                      {post.author_name}
                    </button>
                    <p>@{post.author_username} · {new Date(post.created_at).toLocaleString()}</p>
                  </div>
                  <span className="post-visibility">{post.visibility === 'private' ? 'Only me' : 'All members'}</span>
                </div>
                {post.content && <p className="post-text">{post.content}</p>}
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  )
}
