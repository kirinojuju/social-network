import { useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileFriends from "./ProfileFriend";
import ProfilePhotos from "./ProfilePhoto";
import { profileClient } from "../../auth/profile";

import "./Profile.css";

function Profile({ user, profile: ownProfile, profileId, onProfileChange, onMessage, onSignOut, signOutBusy }) {
  const isOwn = !profileId || profileId === ownProfile?.id;
  const [other, setOther] = useState({ id: null, profile: null });

  useEffect(() => {
    if (isOwn) return;
    let active = true;
    profileClient.getUser(user, profileId)
      .then(found => { if (active) setOther({ id: profileId, profile: found }); })
      .catch(() => { if (active) setOther({ id: profileId, profile: null }); });
    return () => { active = false; };
  }, [user, profileId, isOwn]);

  const loaded = isOwn || other.id === profileId;
  const profile = isOwn ? ownProfile : loaded ? other.profile : null;

  if (!loaded) return <div className="profile-page"><p role="status">Loading profile…</p></div>;
  if (!profile) return <div className="profile-page"><p>This profile is not available.</p></div>;

  return (
    <div className="profile-page">

      <p className="profile-preview-note">Friends and photos are layout previews; live data is not connected yet.</p>

      {/* TOP PROFILE */}
      <ProfileHeader key={profile.id} isOwn={isOwn} user={user} profile={profile} onProfileChange={onProfileChange}
        onMessage={onMessage} onSignOut={onSignOut} signOutBusy={signOutBusy} />

      {/* PROFILE CONTENT */}
      <div className="profile-content">

        {/* LEFT SIDE */}
        <main className="profile-feed">
          {/* We can add user's posts here later */}
        </main>

        {/* RIGHT SIDE */}
        <aside className="profile-right">

          <ProfileFriends />

          <ProfilePhotos />

        </aside>

      </div>

    </div>
  );
}

export default Profile;
