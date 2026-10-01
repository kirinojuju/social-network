import ProfileHeader from "./ProfileHeader";
import ProfileFriends from "./ProfileFriend";
import ProfilePhotos from "./ProfilePhoto";

import "./Profile.css";

function Profile() {
  return (
    <div className="profile-page">

      {/* TOP PROFILE */}
      <ProfileHeader />

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