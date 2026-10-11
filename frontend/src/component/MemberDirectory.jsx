import { useState } from 'react'

export default function MemberDirectory({ people, loading, error, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const visiblePeople = expanded ? people : people.slice(0, 6)

  return <section className="member-directory" aria-label="Members">
    <div className="feed-heading">
      <h2>Members</h2>
      {error && <button className="tool-button" type="button" disabled={loading} onClick={onRefresh}>Try again</button>}
    </div>
    {loading && <p role="status">Loading members…</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!loading && !error && people.length === 0 && <p>No other members yet.</p>}
    <ul className="member-list">
      {visiblePeople.map(person => <li key={person.id}>
        <span className="member-initial" aria-hidden="true">{person.display_name?.slice(0, 1)}</span>
        <div><strong>{person.display_name}</strong><span>@{person.username}</span></div>
      </li>)}
    </ul>
    {people.length > 6 && <button className="tool-button" type="button" aria-expanded={expanded}
      onClick={() => setExpanded(value => !value)}>{expanded ? 'Show fewer' : 'Show more members'}</button>}
  </section>
}
