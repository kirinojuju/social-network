import ProfileHeader from "./ProfileHeader";
import ProfileFriends from "./ProfileFriend";
import ProfilePhotos from "./ProfilePhoto";

import "./Profile.css";

function Profile({ profile }) {
  return (
    <div className="profile-page">

      <p className="profile-preview-note">Friends and photos are layout previews; live data is not connected yet.</p>

      {/* TOP PROFILE */}
      <ProfileHeader profile={profile} />

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
