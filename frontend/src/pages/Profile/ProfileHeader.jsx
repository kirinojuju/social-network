import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import "./ProfileHeader.css";

function ProfileHeader() {
  return (
    <section className="profile-header">

      {/* ========================================
          COVER PHOTO
      ======================================== */}

      <div className="profile-cover">

        <div className="cover-placeholder">
          <span>△</span>
        </div>

        <button className="change-cover-button">
          <CameraAltOutlinedIcon />
          Change cover
        </button>

      </div>


      {/* ========================================
          PROFILE INFORMATION
      ======================================== */}

      <div className="profile-info">

        {/* PROFILE PICTURE */}

        <div className="profile-picture-wrapper">

          <AccountCircleOutlinedIcon className="profile-picture" />

          <button className="profile-camera-button">
            <CameraAltOutlinedIcon />
          </button>

        </div>


        {/* USER INFORMATION */}

        <div className="profile-user-info">

          <div className="profile-name-row">

            <h1>Sally</h1>

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


        {/* EDIT BUTTON */}

        <button className="edit-profile-button">
          <EditOutlinedIcon />
          Edit Profile
        </button>

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