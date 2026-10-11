import { useEffect, useState } from 'react'
import { search } from '../search/client'
import './MiddlePage.css'
import './SearchResults.css'

export default function SearchResults({ user, query }) {
  const term = query.trim()
  const [results, setResults] = useState({ term: '', users: [], posts: [] })
  const loading = results.term !== term

  useEffect(() => {
    const controller = new AbortController()
    search(user, term, { signal: controller.signal })
      .then(found => setResults({ term, ...found }))
      .catch(() => {
        // Any failure is shown to the member as an empty result.
        if (!controller.signal.aborted) setResults({ term, users: [], posts: [] })
      })
    return () => controller.abort()
  }, [user, term])

  const empty = !loading && !results.users.length && !results.posts.length

  return (
    <main className="middle-page">
      <section className="feed-content search-page" aria-live="polite">
        <h2>Search results for “{term}”</h2>

        {loading && <p role="status">Searching…</p>}
        {empty && <p className="search-empty">No results found</p>}

        {!loading && results.users.length > 0 && (
          <section className="member-directory" aria-label="People">
            <h2>People</h2>
            <ul className="member-list">
              {results.users.map(person => (
                <li key={person.id}>
                  <span className="member-initial" aria-hidden="true">{person.display_name?.slice(0, 1)}</span>
                  <div>
                    <strong>
                      {person.display_name}
                      {person.is_self && <em className="search-badge">You</em>}
                    </strong>
                    <span>@{person.username}</span>
                  </div>
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
                  <div className="avatar" aria-hidden="true">👤</div>
                  <div>
                    <strong>{post.author_name}</strong>
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
