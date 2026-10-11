import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'

import './Top_bar.css'

export default function TopBar({ onOpenProfile, onOpenExplore, searchQuery, onSearchChange, onSearchSubmit }) {
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

        <button className="top-bar-button" type="button">
          <EditOutlinedIcon />
        </button>

        <button className="top-bar-button" type="button">
          <NotificationsNoneOutlinedIcon />
        </button>

        <button
          className="top-bar-profile"
          type="button"
          onClick={onOpenProfile}
        >
          <AccountCircleOutlinedIcon />
        </button>

      </div>

    </header>
  )
}
