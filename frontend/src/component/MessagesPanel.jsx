import { useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "./Avatar";
import { listConversations } from "../messages/client";
import { shortTimeAgo } from "../messages/time";
import { profileClient } from "../auth/profile";
import { useAutoRefresh } from "../live/useAutoRefresh";

import "./MessagesPanel.css";

function PersonRow({ user, person, detail, unread, time, onOpen }) {
  return (
    <li>
      <button type="button" className={`messages-row${unread ? " unread" : ""}`} onClick={() => onOpen(person)}>
        <Avatar user={user} userId={person.id} className="messages-avatar" />
        <span className="messages-text">
          <span className="messages-name">{person.display_name}</span>
          {detail && (
            <span className="messages-detail">
              <span className="messages-snippet">{detail}</span>
              {time && <span> · {time}</span>}
            </span>
          )}
        </span>
        {unread > 0 && <span className="messages-dot" aria-label={`${unread} unread`} />}
      </button>
    </li>
  );
}

function MessagesPanel({ user, people, onOpenChat, onClose }) {
  const panelRef = useRef(null);
  const [data, setData] = useState({ loaded: false, conversations: [], friends: [] });

  async function load(signal) {
    const [conversations, friends] = await Promise.all([
      listConversations(user, { signal }).catch(() => []),
      profileClient.listFollowing(user, { signal }).catch(() => []),
    ]);
    if (!signal?.aborted) setData({ loaded: true, conversations, friends });
  }

  useAutoRefresh(load, 10000, true, user.uid);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target) &&
          !event.target.closest?.("[data-messages-toggle]")) onClose();
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const chatted = new Set(data.conversations.map(conversation => conversation.id));
  const friends = data.friends.filter(friend => !chatted.has(friend.id));
  const suggestions = data.friends.length ? [] : people.filter(person => !chatted.has(person.id)).slice(0, 8);

  return (
    <section className="messages-panel" ref={panelRef} aria-label="Chats">
      <header className="messages-header">
        <h2>Chats</h2>
        <button type="button" className="messages-close" aria-label="Close chats" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      {!data.loaded && <p className="messages-status" role="status">Loading chats…</p>}

      {data.conversations.length > 0 && (
        <ul className="messages-list">
          {data.conversations.map(conversation => (
            <PersonRow
              key={conversation.id}
              user={user}
              person={conversation}
              detail={`${conversation.from_me ? "You: " : ""}${
                conversation.last_content || (conversation.last_has_image ? "Sent a photo" : "")}`}
              time={shortTimeAgo(conversation.last_at)}
              unread={conversation.unread_count}
              onOpen={onOpenChat}
            />
          ))}
        </ul>
      )}

      {data.loaded && friends.length > 0 && (
        <>
          <h3 className="messages-section-title">Friends</h3>
          <ul className="messages-list">
            {friends.map(friend => (
              <PersonRow key={friend.id} user={user} person={friend} detail="Say hi 👋" onOpen={onOpenChat} />
            ))}
          </ul>
        </>
      )}

      {data.loaded && suggestions.length > 0 && (
        <>
          <h3 className="messages-section-title">People you may know</h3>
          <ul className="messages-list">
            {suggestions.map(person => (
              <PersonRow key={person.id} user={user} person={person} detail="Start a conversation" onOpen={onOpenChat} />
            ))}
          </ul>
        </>
      )}

      {data.loaded && !data.conversations.length && !friends.length && !suggestions.length && (
        <p className="messages-status">No chats yet.</p>
      )}
    </section>
  );
}

export default MessagesPanel;
