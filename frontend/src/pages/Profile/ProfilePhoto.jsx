import PostImage from "../../posts/PostImage";
import "./ProfilePhoto.css";

function ProfilePhotos({ user, media, onOpenPhoto, onSeeAll }) {
  const shown = media.photos.slice(0, 9);

  return (
    <section className="profile-photos">

      <div className="profile-photos-heading">
        <h2>Photos</h2>
        {media.photos.length > shown.length && (
          <button type="button" className="profile-photos-all" onClick={onSeeAll}>See all</button>
        )}
      </div>

      {media.loading && <p className="profile-photos-note" role="status">Loading photos…</p>}
      {!media.loading && shown.length === 0 && <p className="profile-photos-note">No photos yet.</p>}

      {shown.length > 0 && (
        <div className="photos-grid">
          {shown.map(post => (
            <button type="button" className="photo-tile" key={post.image_id}
              aria-label={post.content ? `Open photo: ${post.content.slice(0, 60)}` : "Open photo"}
              onClick={() => onOpenPhoto(post)}>
              <PostImage user={user} id={post.image_id} className="photo-tile-image" alt="" />
            </button>
          ))}
        </div>
      )}

    </section>
  );
}

export default ProfilePhotos;
