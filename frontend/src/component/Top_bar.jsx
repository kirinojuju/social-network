import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import Avatar from './Avatar'

import './Top_bar.css'

export default function TopBar({ user, profileId, avatarVersion, onOpenProfile, onOpenExplore, onCreatePost,
  unreadNotifications, onToggleNotifications, searchQuery, onSearchChange, onSearchSubmit }) {
  return (
    <header className="top-bar">

      <form
        className="top-bar-search"
        role="search"
        onClick={onOpenExplore}
        onSubmit={event => {
          event.preventDefault()
          onSearchSubmit(searchQuery)
        }}
      >
        <SearchOutlinedIcon />

        <input
          type="text"
          aria-label="Search people and posts"
          placeholder="Search people, posts, courses, and more..."
          value={searchQuery}
          maxLength={100}
          onFocus={onOpenExplore}
          onChange={event => {
            onSearchChange(event.target.value)
            onOpenExplore()
          }}
        />
      </form>

      <div className="top-bar-actions">

        <button className="top-bar-button" type="button" aria-label="Create post" onClick={onCreatePost}>
          <EditOutlinedIcon />
        </button>

        <button className="top-bar-button top-bar-bell" type="button" data-notifications-toggle
          aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} new` : "Notifications"}
          onClick={onToggleNotifications}>
          <NotificationsNoneOutlinedIcon />
          {unreadNotifications > 0 && (
            <span className="top-bar-badge" aria-hidden="true">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
          )}
        </button>

        <button
          className="top-bar-profile"
          type="button"
          aria-label="Your profile"
          onClick={onOpenProfile}
        >
          <Avatar user={user} userId={profileId} version={avatarVersion} className="top-bar-avatar" />
        </button>

      </div>

    </header>
  )
}
