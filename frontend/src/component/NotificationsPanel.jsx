import { useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Avatar from "./Avatar";
import { shortTimeAgo } from "../messages/time";
import { isUnread } from "../notifications/seen";

import "./NotificationsPanel.css";

const kinds = {
  like: { Icon: FavoriteIcon, className: "is-like" },
  comment: { Icon: ChatBubbleIcon, className: "is-comment" },
  follow: { Icon: PersonAddIcon, className: "is-follow" },
};

function describe(notification) {
  if (notification.type === "like") {
    return <>liked your post{notification.post_excerpt ? <>: “{notification.post_excerpt}”</> : " (photo)"}</>;
  }
  if (notification.type === "comment") return <>commented on your post: “{notification.comment_excerpt}”</>;
  return "started following you.";
}

function NotificationsPanel({ user, notifications, loaded, since, onOpenProfile, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target) &&
          !event.target.closest?.("[data-notifications-toggle]")) onClose();
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

  return (
    <section className="notifications-panel" ref={panelRef} aria-label="Notifications">
      <header className="notifications-header">
        <h2>Notifications</h2>
        <button type="button" className="notifications-close" aria-label="Close notifications" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      {!loaded && <p className="notifications-status" role="status">Loading notifications…</p>}
      {loaded && notifications.length === 0 && (
        <p className="notifications-status">
          No notifications yet. Likes, comments and new followers will show up here.
        </p>
      )}

      {notifications.length > 0 && (
        <ul className="notifications-list">
          {notifications.map(notification => {
            const { Icon, className } = kinds[notification.type] || kinds.follow;
            const unread = isUnread(notification, since);
            return (
              <li key={notification.id}>
                <button type="button" className={`notifications-row${unread ? " unread" : ""}`}
                  onClick={() => onOpenProfile(notification.type === "follow" ? notification.actor_id : null)}>
                  <span className="notifications-avatar-wrap">
                    <Avatar user={user} userId={notification.actor_id} className="notifications-avatar" />
                    <span className={`notifications-kind ${className}`} aria-hidden="true"><Icon /></span>
                  </span>
                  <span className="notifications-text">
                    <span className="notifications-message">
                      <strong>{notification.actor_name}</strong> {describe(notification)}
                    </span>
                    <span className="notifications-time">{shortTimeAgo(notification.created_at)}</span>
                  </span>
                  {unread && <span className="notifications-dot" aria-label="New" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default NotificationsPanel;
