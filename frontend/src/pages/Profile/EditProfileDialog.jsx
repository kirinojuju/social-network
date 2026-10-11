import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { profileClient, profileToSync } from "../../auth/profile";
import { saveFirestoreProfile } from "../../auth/firestore-profile";

import "./EditProfileDialog.css";

function EditProfileDialog({ user, profile, hasPhoto, onChangePhoto, onRemovePhoto, photoBusy, onSaved, onClose }) {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await profileClient.syncAndRead(user, {
        ...profileToSync(profile),
        username: username.trim(),
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      });
      // The Firestore copy is refreshed again on next sign-in, so a failure here is not fatal.
      await saveFirestoreProfile(user, updated).catch(() => {});
      onSaved(updated);
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <div className="edit-profile-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <section className="edit-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
        <header className="edit-profile-header">
          <h2 id="edit-profile-title">Edit profile</h2>
          <button type="button" className="edit-profile-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="edit-profile-photo-row">
          <span>Profile photo</span>
          <div>
            <button type="button" className="edit-profile-secondary" disabled={busy || photoBusy} onClick={onChangePhoto}>
              {hasPhoto ? "Change photo" : "Add photo"}
            </button>
            {hasPhoto && (
              <button type="button" className="edit-profile-secondary" disabled={busy || photoBusy} onClick={onRemovePhoto}>
                Remove photo
              </button>
            )}
          </div>
        </div>

        <form onSubmit={submit}>
          <fieldset className="edit-profile-fields" disabled={busy}>
            <label>
              Display name
              <input type="text" value={displayName} maxLength={100} required autoFocus
                onChange={event => setDisplayName(event.target.value)} />
            </label>
            <label>
              Username
              <input type="text" value={username} minLength={3} maxLength={30} required
                pattern="[a-z0-9_]{3,30}" title="Use 3–30 lowercase letters, numbers, or underscores"
                onChange={event => setUsername(event.target.value.toLowerCase())} />
            </label>
            <label>
              Bio
              <textarea value={bio} maxLength={2000} rows={4} placeholder="Tell people about yourself"
                onChange={event => setBio(event.target.value)} />
            </label>
          </fieldset>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <div className="edit-profile-actions">
            <button type="button" className="edit-profile-secondary" disabled={busy} onClick={onClose}>Cancel</button>
            <button type="submit" className="edit-profile-save" disabled={busy || !displayName.trim()}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditProfileDialog;
