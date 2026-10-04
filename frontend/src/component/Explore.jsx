import { useState } from 'react'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import './Explore.css'

export default function Explore({ people, loading, error, onRefresh }) {
  const [query, setQuery] = useState('')
  const matches = people.filter(person =>
    `${person.display_name} ${person.username}`.toLowerCase().includes(query.trim().toLowerCase()))

  return <main className="explore-page">
    <section className="explore-main">
      <label className="explore-search-container">
        <SearchOutlinedIcon className="explore-search-icon" />
        <input type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Search people by name or username" aria-label="Search people" />
      </label>
      <section className="people-section" aria-label="People on UniConnect">
        <div className="people-heading">
          <div><h2>People on UniConnect</h2><p>Members who have signed in and created a profile.</p></div>
          <button type="button" onClick={onRefresh} disabled={loading}>Refresh</button>
        </div>
        {loading && <p role="status">Loading people…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && matches.length === 0 &&
          <p>{query ? 'No people match your search.' : 'No other profiles yet. Ask a friend to sign in first.'}</p>}
        <div className="people-list">
          {matches.map(person => <article className="person-card" key={person.uid}>
            <AccountCircleOutlinedIcon aria-hidden="true" />
            <div><strong>{person.display_name}</strong><span>@{person.username}</span></div>
          </article>)}
        </div>
      </section>
    </section>
  </main>
}
