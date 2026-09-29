import { useState } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import "./RightSideBar.css";

const suggestedPeople = [
  { id: 1, name: "User_Name", faculty: "Engineering" },
  { id: 2, name: "User_Name", faculty: "Engineering" },
  { id: 3, name: "User_Name", faculty: "Engineering" },
];

const recommendedGroups = [
  { id: 1, name: "Group_Name", members: "2.3k members" },
  { id: 2, name: "Group_Name", members: "2.3k members" },
  { id: 3, name: "Group_Name", members: "2.3k members" },
];

function RightSideBar() {
  // ids the user has followed / joined
  const [followed, setFollowed] = useState([]);
  const [joined, setJoined] = useState([]);

  const toggle = (id, list, setList) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <aside className="right-sidebar">
      <section className="rs-section">
        <h2 className="rs-title">Suggested People</h2>
        {suggestedPeople.map((p) => (
          <div className="rs-item" key={p.id}>
            <AccountCircleOutlinedIcon className="rs-avatar" />
            <div className="rs-info">
              <span className="rs-name">{p.name}</span>
              <span className="rs-sub">{p.faculty}</span>
            </div>
            <button
              type="button"
              className={`rs-btn ${followed.includes(p.id) ? "active" : ""}`}
              onClick={() => toggle(p.id, followed, setFollowed)}
            >
              {followed.includes(p.id) ? "Following" : "Follow"}
            </button>
          </div>
        ))}
        <button type="button" className="rs-more">Show more...</button>
      </section>

      <section className="rs-section">
        <h2 className="rs-title">Recommended</h2>
        {recommendedGroups.map((g) => (
          <div className="rs-item" key={g.id}>
            <AccountCircleOutlinedIcon className="rs-avatar" />
            <div className="rs-info">
              <span className="rs-name">{g.name}</span>
              <span className="rs-sub">{g.members}</span>
            </div>
            <button
              type="button"
              className={`rs-btn ${joined.includes(g.id) ? "active" : ""}`}
              onClick={() => toggle(g.id, joined, setJoined)}
            >
              {joined.includes(g.id) ? "Joined" : "Join"}
            </button>
          </div>
        ))}
        <button type="button" className="rs-more">Show more...</button>
      </section>
    </aside>
  );
}

export default RightSideBar;