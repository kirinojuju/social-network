import { useEffect, useRef, useState } from 'react'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

// The "⋯" menu on the author's own posts.
export default function PostMenu({ disabled, onDelete }) {
  const [open, setOpen] = useState(false)
  const menu = useRef(null)

  useEffect(() => {
    if (!open) return
    function close(event) {
      if (event.type === 'keydown' ? event.key === 'Escape' : !menu.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className="post-menu" ref={menu}>
      <button type="button" className="post-menu-toggle" aria-label="Post options" aria-haspopup="menu"
        aria-expanded={open} disabled={disabled} onClick={() => setOpen(value => !value)}>
        <MoreHorizIcon />
      </button>
      {open && (
        <div className="post-menu-list" role="menu">
          <button type="button" role="menuitem" className="post-menu-delete"
            onClick={() => { setOpen(false); onDelete() }}>
            <DeleteOutlinedIcon /> Delete post
          </button>
        </div>
      )}
    </div>
  )
}
