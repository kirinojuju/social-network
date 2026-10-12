import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useAvatar } from "../pages/Profile/useAvatar";
import "./Avatar.css";

function Avatar({ user, userId, className, version = 0 }) {
  const photoUrl = useAvatar(user, userId, version);
  return photoUrl
    ? <img className={`avatar-photo ${className}`} src={photoUrl} alt="" />
    : <AccountCircleOutlinedIcon className={className} />;
}

export default Avatar;
