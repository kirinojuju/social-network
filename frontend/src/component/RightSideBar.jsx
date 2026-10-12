import { useState } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useAvatar } from "../pages/Profile/useAvatar";
import { useFollow } from "../pages/Profile/useFollow";
import "./RightSideBar.css";

function SuggestedPerson({ user, person, onOpenProfile }) {
  const photoUrl = useAvatar(user, person.id, 0);
  const follow = useFollow(user, person.id);
  const following = follow.summary?.following;

  return (
    <div className="rs-item">
      <button type="button" className="rs-person" onClick={() => onOpenProfile(person.id)}>
        {photoUrl
          ? <img className="rs-avatar rs-photo" src={photoUrl} alt="" />
          : <AccountCircleOutlinedIcon className="rs-avatar" />}
        <span className="rs-info">
          <span className="rs-name">{person.display_name}</span>
        </span>
      </button>
      <button
        type="button"
        className={`rs-btn ${following ? "active" : ""}`}
        disabled={!follow.summary || follow.busy}
        title={follow.error || undefined}
        onClick={follow.toggle}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function RightSideBar({ user, people = [], loading, onOpenProfile }) {
  const [showAllPeople, setShowAllPeople] = useState(false);
  const visiblePeople = showAllPeople ? people : people.slice(0, 3);

  return (
    <aside className="right-sidebar">
      <section className="rs-section">
        <h2 className="rs-title">Suggested People</h2>
        {loading && people.length === 0 && <p className="rs-sub">Loading people…</p>}
        {!loading && people.length === 0 && <p className="rs-sub">No suggestions yet.</p>}
        {visiblePeople.map((person) => (
          <SuggestedPerson key={person.id} user={user} person={person} onOpenProfile={onOpenProfile} />
        ))}
        {people.length > 3 && (
          <button type="button" className="rs-more" onClick={() => setShowAllPeople(value => !value)}>
            {showAllPeople ? "Show less" : "Show more..."}
          </button>
        )}
      </section>
    </aside>
  );
}

export default RightSideBar;
