import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'

import './Top_bar.css'

export default function TopBar({ onOpenProfile, onOpenExplore }) {
  return (
    <header className="top-bar">

      <div
        className="top-bar-search"
        onClick={onOpenExplore}
      >
        <SearchOutlinedIcon />

        <input
          type="text"
          placeholder="Search people, posts, courses, and more..."
          onFocus={onOpenExplore}
        />
      </div>

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