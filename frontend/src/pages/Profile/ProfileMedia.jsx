import PostImage from "../../posts/PostImage";
import "./ProfileMedia.css";

function ProfileMedia({ user, media, onOpenPhoto }) {
  return (
    <section className="profile-media" aria-label="Media">
      <h2>Media</h2>
      {media.loading && <p role="status">Loading photos…</p>}
      {!media.loading && media.error && <p className="auth-error" role="alert">{media.error}</p>}
      {!media.loading && !media.error && media.photos.length === 0 && <p className="profile-media-empty">No photos yet.</p>}
      {!media.loading && media.photos.length > 0 && (
        <div className="profile-media-grid">
          {media.photos.map((photo, index) => (
            <button type="button" key={photo.id} className="profile-media-item"
              aria-label={photo.caption ? `Open photo: ${photo.caption.slice(0, 60)}` : "Open photo"}
              onClick={() => onOpenPhoto(index)}>
              <PostImage user={user} id={photo.id} className="profile-media-thumb" alt="" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProfileMedia;
