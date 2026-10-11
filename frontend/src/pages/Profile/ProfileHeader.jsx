import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { useRef, useState } from "react";
import { profileClient } from "../../auth/profile";
import { prepareAvatar, preparePhoto } from "../../images/prepare";
import { useAvatar } from "./useAvatar";
import { useFollow } from "./useFollow";
import EditProfileDialog from "./EditProfileDialog";

import "./ProfileHeader.css";

function ProfileHeader({ isOwn, user, profile, onProfileChange, onAvatarChange, onMessage, onSignOut, signOutBusy,
  tabs, activeTab, onTabChange }) {

  const isPersonal = isOwn;
  const follow = useFollow(user, profile?.id);

  const photoInput = useRef(null);
  const coverInput = useRef(null);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [coverVersion, setCoverVersion] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [editing, setEditing] = useState(false);
  const photoUrl = useAvatar(user, profile?.id, photoVersion);
  const coverUrl = useAvatar(user, profile?.id, coverVersion, "cover");

  async function updatePhoto(action, setVersion = setPhotoVersion) {
    if (photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await action();
      setVersion(version => version + 1);
      if (setVersion === setPhotoVersion) onAvatarChange?.();
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

  function chooseCover(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (file) updatePhoto(async () => profileClient.saveAvatar(user, await preparePhoto(file), "cover"), setCoverVersion);
  }

  return (
    <section className="profile-header">

      {/* ========================================
          COVER PHOTO
      ======================================== */}

      <div className="profile-cover">

        {coverUrl
          ? <img className="profile-cover-image" src={coverUrl} alt="Cover photo" />
          : <div className="cover-placeholder" />}

        {isPersonal && (
          <div className="cover-actions">
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={chooseCover} />
            {coverUrl && (
              <button type="button" className="change-cover-button" disabled={photoBusy}
                onClick={() => updatePhoto(() => profileClient.removeAvatar(user, "cover"), setCoverVersion)}>
                Remove
              </button>
            )}
            <button type="button" className="change-cover-button" disabled={photoBusy}
              onClick={() => coverInput.current?.click()}>
              <CameraAltOutlinedIcon />
              {coverUrl ? "Change cover" : "Add cover photo"}
            </button>
          </div>
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

      <nav className="profile-tabs" aria-label="Profile sections">
        {tabs.map(tab => (
          <button type="button" key={tab} className={`profile-tab${tab === activeTab ? " active" : ""}`}
            aria-current={tab === activeTab ? "page" : undefined} onClick={() => onTabChange(tab)}>
            {tab}
          </button>
        ))}
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