import "./ProfilePhoto.css";

const photos = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
  { id: 8 },
  { id: 9 },
];

function ProfilePhotos() {
  return (
    <section className="profile-photos">

      <h2>Photos</h2>

      <div className="photos-grid">

        {photos.map((photo) => (
          <div
            className="photo-placeholder"
            key={photo.id}
          >
            <span>△</span>
          </div>
        ))}

      </div>

    </section>
  );
}

export default ProfilePhotos;