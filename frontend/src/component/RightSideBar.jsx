import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import './RightSideBar.css'

export default function RightSideBar({ people, loading, onExplore }) {
  return <aside className="right-sidebar">
    <section className="rs-section">
      <h2 className="rs-title">People on UniConnect</h2>
      {loading && <p role="status">Loading people…</p>}
      {!loading && people.length === 0 && <p>No other profiles yet.</p>}
      {people.slice(0, 5).map(person => <div className="rs-item" key={person.uid}>
        <AccountCircleOutlinedIcon className="rs-avatar" aria-hidden="true" />
        <div className="rs-info">
          <span className="rs-name">{person.display_name}</span>
          <span className="rs-sub">@{person.username}</span>
        </div>
      </div>)}
      <button type="button" className="rs-more" onClick={onExplore}>See everyone</button>
    </section>
  </aside>
}
