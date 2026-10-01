import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import "./ProfileHeader.css";

function ProfileHeader({ profileType = "personal" }) {

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

            <h1>User_Name</h1>

            <span className="profile-status">
              Student · Joined Oct 2025
            </span>

          </div>

          <p className="profile-major">
            ISNE · Faculty of Engineering · Chiang Mai University
          </p>

          <div className="profile-followers">

            <span>
              <strong>104</strong> Followers
            </span>

            <span>
              <strong>320</strong> Following
            </span>

          </div>

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