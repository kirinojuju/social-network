import { useCallback, useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileFriends from "./ProfileFriend";
import ProfilePhotos from "./ProfilePhoto";
import PostList from "../../posts/PostList";
import ProfileMedia from "./ProfileMedia";
import PhotoViewer from "../../posts/PhotoViewer";
import { useProfilePhotos } from "./useProfilePhotos";
import { profileClient } from "../../auth/profile";

import "./Profile.css";

function Profile({ user, profile: ownProfile, profileId, onProfileChange, onAvatarChange, onMessage, onOpenProfile,
  onSignOut, signOutBusy }) {
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

  const [selectedTab, setSelectedTab] = useState({ id: null, tab: "All" });
  const [viewing, setViewing] = useState({ id: null, index: null });
  const closeViewer = useCallback(() => setViewing({ id: null, index: null }), []);
  const [friendsVersion, setFriendsVersion] = useState(0);

  const loaded = isOwn || other.id === profileId;
  const profile = isOwn ? ownProfile : loaded ? other.profile : null;
  const media = useProfilePhotos(user, profile?.id);

  if (!loaded) return <div className="profile-page"><p role="status">Loading profile…</p></div>;
  if (!profile) return <div className="profile-page"><p>This profile is not available.</p></div>;

  // Saved posts are private, so the Saved tab exists only on your own profile.
  const tabs = isOwn ? ["All", "Saved", "Media"] : ["All", "Media"];
  const activeTab = selectedTab.id === profile.id && tabs.includes(selectedTab.tab) ? selectedTab.tab : "All";
  const openPhoto = index => setViewing({ id: profile.id, index });

  return (
    <div className="profile-page">

      {/* TOP PROFILE */}
      <ProfileHeader key={profile.id} isOwn={isOwn} user={user} profile={profile} onProfileChange={onProfileChange}
        onAvatarChange={onAvatarChange} onFollowChange={() => setFriendsVersion(version => version + 1)}
        onMessage={onMessage} onSignOut={onSignOut} signOutBusy={signOutBusy}
        tabs={tabs} activeTab={activeTab} onTabChange={tab => setSelectedTab({ id: profile.id, tab })} />

      {/* PROFILE CONTENT */}
      <div className="profile-content">

        {/* LEFT SIDE */}
        <main className="profile-feed">
          {activeTab === "All" && (
            <PostList user={user} author={profile.id} title="Posts" emptyText="No posts yet."
              onOpenProfile={onOpenProfile} />
          )}
          {activeTab === "Saved" && (
            <PostList user={user} scope="saved" title="Saved posts" onOpenProfile={onOpenProfile}
              emptyText="You haven't saved any posts yet. Tap Save on a post to keep it here." />
          )}
          {activeTab === "Media" && <ProfileMedia user={user} media={media} onOpenPhoto={openPhoto} />}
        </main>

        {/* RIGHT SIDE */}
        <aside className="profile-right">

          <ProfileFriends user={user} profileId={profile.id} isOwn={isOwn} version={friendsVersion}
            onOpenProfile={id => onOpenProfile(id === ownProfile?.id ? null : id)} />

          <ProfilePhotos user={user} media={media} onOpenPhoto={openPhoto}
            onSeeAll={() => setSelectedTab({ id: profile.id, tab: "Media" })} />

        </aside>

      </div>

      {viewing.index !== null && viewing.id === profile.id && media.photos.length > 0 && (
        <PhotoViewer user={user} photos={media.photos} startIndex={viewing.index} onClose={closeViewer} />
      )}

    </div>
  );
}

export default Profile;
