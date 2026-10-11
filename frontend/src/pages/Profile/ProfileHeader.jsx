import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { useRef, useState } from "react";
import { profileClient } from "../../auth/profile";
import { prepareAvatar } from "../../images/prepare";
import { useAvatar } from "./useAvatar";
import { useFollow } from "./useFollow";
import EditProfileDialog from "./EditProfileDialog";

import "./ProfileHeader.css";

function ProfileHeader({ isOwn, user, profile, onProfileChange, onMessage, onSignOut, signOutBusy }) {

  const isPersonal = isOwn;
  const follow = useFollow(user, profile?.id);

  const photoInput = useRef(null);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [editing, setEditing] = useState(false);
  const photoUrl = useAvatar(user, profile?.id, photoVersion);

  async function updatePhoto(action) {
    if (photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await action();
      setPhotoVersion(version => version + 1);
    } catch (failure) {
      setPhotoError(failure.message);
    } finally {
      setPhotoBusy(false);
    }
  }

  function choosePhoto(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (file) updatePhoto(async () => profileClient.saveAvatar(user, await prepareAvatar(file)));
  }

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

          {photoUrl
            ? <img className="profile-picture" src={photoUrl} alt="Profile photo" />
            : <AccountCircleOutlinedIcon className="profile-picture" />}

          {isPersonal && (
            <>
              <input ref={photoInput} type="file" accept="image/*" hidden onChange={choosePhoto} />
              <button
                type="button"
                className="profile-camera-button"
                aria-label={photoUrl ? "Change profile photo" : "Add profile photo"}
                disabled={photoBusy}
                onClick={() => photoInput.current?.click()}
              >
                <CameraAltOutlinedIcon />
              </button>
            </>
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

          {follow.summary && (
            <div className="profile-followers">
              <span><strong>{follow.summary.followers}</strong> {follow.summary.followers === 1 ? "follower" : "followers"}</span>
              <span><strong>{follow.summary.following_count}</strong> following</span>
            </div>
          )}

          {follow.error && <p className="auth-error" role="alert">{follow.error}</p>}
          {photoBusy && <p className="profile-photo-status" role="status">Saving photo…</p>}
          {photoError && <p className="auth-error" role="alert">{photoError}</p>}

        </div>


        {/* ========================================
            PROFILE ACTIONS
        ======================================== */}

        <div className="profile-actions">

          {/* PERSONAL PROFILE */}

          {isPersonal && (
            <>
              <button type="button" className="edit-profile-button" disabled={!profile} onClick={() => setEditing(true)}>
                <EditOutlinedIcon />
                Edit Profile
              </button>

              <button type="button" className="sign-out-button" disabled={signOutBusy} onClick={onSignOut}>
                Sign Out
              </button>
            </>
          )}


          {/* OTHER MEMBER */}

          {!isPersonal && (
            <>
              <button
                type="button"
                className={follow.summary?.following ? "following-button" : "follow-button"}
                disabled={!follow.summary || follow.busy}
                onClick={follow.toggle}
              >
                {follow.summary?.following ? "Unfollow" : "Follow"}
              </button>

              <button
                type="button"
                className="message-button"
                onClick={() => onMessage?.(profile)}
              >
                <ChatBubbleOutlineOutlinedIcon />
                Message
              </button>
            </>
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

      {editing && (
        <EditProfileDialog
          user={user}
          profile={profile}
          hasPhoto={Boolean(photoUrl)}
          photoBusy={photoBusy}
          onChangePhoto={() => photoInput.current?.click()}
          onRemovePhoto={() => updatePhoto(() => profileClient.removeAvatar(user))}
          onSaved={updated => {
            onProfileChange(updated);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}

    </section>
  );
}

export default ProfileHeader;