import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SentimentSatisfiedOutlinedIcon from "@mui/icons-material/SentimentSatisfiedOutlined";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import "./LeftSideBar.css";

const mainMenu = [
  {
    name: "Home",
    icon: HomeOutlinedIcon,
  },
  {
    name: "Explore",
    icon: SearchOutlinedIcon,
  },
  {
    name: "StudyHub",
    icon: MenuBookOutlinedIcon,
  },
  {
    name: "Campus Videos",
    icon: VideocamOutlinedIcon,
  },
  {
    name: "Campus Market",
    icon: ShoppingCartOutlinedIcon,
  },
  {
  name: "Messages",
  icon: MailOutlinedIcon,
  },
  {
    name: "UniAI",
    icon: AutoAwesomeIcon,
  },
  {
    name: "Create Post",
    icon: EditOutlinedIcon,
  },
];

const moreMenu = [
  {
    name: "Notifications",
    icon: NotificationsNoneOutlinedIcon,
  },
  {
    name: "Saved",
    icon: BookmarkBorderOutlinedIcon,
  },
  {
    name: "Setting",
    icon: SettingsOutlinedIcon,
  },
];

function LeftSidebar() {
  return (
    <aside className="left-sidebar">

      {/* LOGO */}
      <div className="sidebar-logo">
        UniConnect
      </div>

      {/* MAIN MENU */}
      <nav className="sidebar-menu">
        {mainMenu.map((item) => {
          const Icon = item.icon;

          return (
            <div className="sidebar-item" key={item.name}>
              <Icon className="sidebar-icon" />
              <span>{item.name}</span>
            </div>
          );
        })}
      </nav>

      {/* DIVIDER */}
      <div className="sidebar-divider"></div>

      {/* MORE */}
      <div className="more-section">

        <div className="more-title">
          More
        </div>

        {moreMenu.map((item) => {
          const Icon = item.icon;

          return (
            <div className="sidebar-item" key={item.name}>
              <Icon className="sidebar-icon" />
              <span>{item.name}</span>
            </div>
          );
        })}

      </div>

      {/* AI CARD */}
      <div className="ai-study-card">

        <div className="ai-card-title">
          Your AI Study Hub
        </div>

        <div className="ai-card-subtitle">
          Ask Anything. Anytime
        </div>

        <div className="ai-card-bottom">
            <div className="ai-smile">
              <SentimentSatisfiedOutlinedIcon />
            </div>

        <button className="ai-chat-button">
            Start Chat
        </button>
        </div>

      </div>

    </aside>
  );
}

export default LeftSidebar;