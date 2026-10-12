import { useState } from "react";
import Avatar from "../../component/Avatar";
import { profileClient } from "../../auth/profile";
import { useAutoRefresh } from "../../live/useAutoRefresh";

import "./ProfileFriend.css";

const shownFriends = 6;

// Friends are members who follow each other.
function ProfileFriends({ user, profileId, isOwn, version = 0, onOpenProfile }) {
  const [state, setState] = useState({ id: null, friends: [], total: 0, error: "" });
  const [showAll, setShowAll] = useState(false);

  useAutoRefresh(async signal => {
    try {
      const result = await profileClient.listFriends(user, profileId, { signal });
      if (!signal.aborted) setState({ id: profileId, ...result, error: "" });
    } catch (failure) {
      if (!signal.aborted) setState(current => current.id === profileId
        ? { ...current, error: failure.message }
        : { id: profileId, friends: [], total: 0, error: failure.message });
    }
  }, 30000, Boolean(profileId), `${profileId}:${version}`);

  const loading = state.id !== profileId;
  const visible = showAll ? state.friends : state.friends.slice(0, shownFriends);

  return (
    <section className="profile-friends">

      <div className="profile-friends-heading">
        <h2>Friends</h2>
        {!loading && state.total > 0 && <span className="profile-friends-count">{state.total}</span>}
      </div>

      {loading && <p className="profile-friends-note" role="status">Loading friends…</p>}
      {!loading && state.error && state.friends.length === 0 && (
        <p className="profile-friends-note" role="alert">{state.error}</p>
      )}
      {!loading && !state.error && state.friends.length === 0 && (
        <p className="profile-friends-note">
          {isOwn ? "No friends yet. When you and someone follow each other, they appear here."
            : "No friends yet."}
        </p>
      )}

      {visible.length > 0 && (
        <div className="friends-list">
          {visible.map((friend) => (
            <button type="button" className="friend-item" key={friend.id} onClick={() => onOpenProfile(friend.id)}>
              <Avatar user={user} userId={friend.id} className="friend-avatar" />
              <span className="friend-info">
                <span className="friend-name">{friend.display_name}</span>
                <span className="friend-username">@{friend.username}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {state.friends.length > shownFriends && (
        <button type="button" className="profile-friends-all" onClick={() => setShowAll(value => !value)}>
          {showAll ? "Show less" : "See all"}
        </button>
      )}

    </section>
  );
}

export default ProfileFriends;
