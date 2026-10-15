import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { logoUrl } from "../brand";
import Avatar from "./Avatar";
import BrandName from "./BrandName";
import "./LeftSideBar.css";

const menu = [
  { id: "home", name: "Home", icon: HomeOutlinedIcon },
  { id: "messages", name: "Messages", icon: MailOutlinedIcon },
  { id: "uniai", name: "UniAI", icon: AutoAwesomeIcon },
  { id: "notifications", name: "Notifications", icon: NotificationsNoneOutlinedIcon },
  { id: "saved", name: "Saved", icon: BookmarkBorderOutlinedIcon },
  { id: "profile", name: "My Profile", icon: PersonOutlineOutlinedIcon },
];

function LeftSidebar({
  user,
  profile,
  avatarVersion,
  activeView,
  onNavigate,
  onLogoClick,
  onOpenAI,
  onOpenMessages,
  onOpenNotifications,
  onOpenProfile,
  onSignOut,
  signOutBusy,
}) {
  const actions = {
    home: () => onNavigate("home"),
    messages: onOpenMessages,
    uniai: onOpenAI,
    notifications: onOpenNotifications,
    saved: () => onNavigate("saved"),
    profile: onOpenProfile,
  };

  return (
    <aside className="left-sidebar">

      {/* LOGO */}
      <button type="button" className="sidebar-logo" onClick={onLogoClick} title="Go to home and refresh">
        <img src={logoUrl} alt="" className="sidebar-logo-icon" />
        <BrandName />
      </button>

      {/* MENU */}
      <nav className="sidebar-menu">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button type="button" className="sidebar-item" key={item.id}
              disabled={!actions[item.id]} onClick={actions[item.id]}
              data-messages-toggle={item.id === "messages" || undefined}
              data-notifications-toggle={item.id === "notifications" || undefined}
              aria-current={item.id === activeView ? "page" : undefined}>
              <Icon className="sidebar-icon" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* ME */}
      <div className="sidebar-me">
        <button type="button" className="sidebar-me-profile" onClick={onOpenProfile}>
          <Avatar user={user} userId={profile?.id} version={avatarVersion} className="sidebar-me-avatar" />
          <span className="sidebar-me-text">
            <span className="sidebar-me-name">{profile?.display_name || "Your profile"}</span>
            {profile?.username && <span className="sidebar-me-username">@{profile.username}</span>}
          </span>
        </button>
        <button type="button" className="sidebar-me-signout" aria-label="Sign out" title="Sign out"
          disabled={signOutBusy} onClick={onSignOut}>
          <LogoutOutlinedIcon />
        </button>
      </div>

    </aside>
  );
}

export default LeftSidebar;
