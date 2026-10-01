import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import "./ProfileHeader.css";

function ProfileHeader({ profileType = "personal", profile }) {

  const isPersonal = profileType === "personal";
  const isFollower = profileType === "follower";
  const isNonFollower = profileType === "non-follower";

  return (
    <section className="profile-header">

      {/* ========================================
          COVER PHOTO
      ======================================== */}

      <div className="profile-cover">

        <div className="cover-placeholder">
          <span>△</span>
        </div>

        {isPersonal && (
          <button className="change-cover-button">
            <CameraAltOutlinedIcon />
            Change cover
          </button>
        )}

      </div>


      {/* ========================================
          PROFILE INFORMATION
      ======================================== */}

      <div className="profile-info">

        {/* PROFILE PICTURE */}

        <div className="profile-picture-wrapper">

          <AccountCircleOutlinedIcon className="profile-picture" />

          {isPersonal && (
            <button className="profile-camera-button">
              <CameraAltOutlinedIcon />
            </button>
          )}

        </div>


        {/* USER INFORMATION */}

        <div className="profile-user-info">

          <div className="profile-name-row">

            <h1>{profile?.display_name || profile?.username || "Profile"}</h1>

            <span className="profile-status">
              {profile?.username ? `@${profile.username}` : ""}
            </span>

          </div>

          {profile?.bio && <p className="profile-major">{profile.bio}</p>}

        </div>


        {/* ========================================
            PROFILE ACTIONS
        ======================================== */}

        <div className="profile-actions">

          {/* PERSONAL PROFILE */}

          {isPersonal && (
            <button className="edit-profile-button">
              <EditOutlinedIcon />
              Edit Profile
            </button>
          )}


          {/* FOLLOWER / FRIEND */}

          {isFollower && (
            <>
              <button className="following-button">
                Following
                <KeyboardArrowDownIcon />
              </button>

              <button className="message-button">
                <ChatBubbleOutlineOutlinedIcon />
                Message
              </button>
            </>
          )}


          {/* NON-FOLLOWER */}

          {isNonFollower && (
            <button className="follow-button">
              Follow
            </button>
          )}

        </div>

      </div>


      {/* ========================================
          PROFILE TABS
      ======================================== */}

      <nav className="profile-tabs">

        <button className="profile-tab active">
          All
        </button>

        <button className="profile-tab">
          About
        </button>

        <button className="profile-tab">
          Connections
        </button>

        <button className="profile-tab">
          Saved
        </button>

        <button className="profile-tab">
          Media
        </button>

      </nav>

    </section>
  );
}

export default ProfileHeader;
