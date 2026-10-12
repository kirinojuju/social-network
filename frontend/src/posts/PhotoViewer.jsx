import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PostImage from "./PostImage";
import "./PhotoViewer.css";

// Full-screen photo viewer. `photos` is a list of { id, caption }; arrows and ←/→ move between them.
function PhotoViewer({ user, photos, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const count = photos.length;
  const photo = photos[Math.min(index, count - 1)];

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") setIndex(current => Math.max(0, current - 1));
      else if (event.key === "ArrowRight") setIndex(current => Math.min(count - 1, current + 1));
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [count, onClose]);

  if (!photo) return null;

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label="Photo"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <button type="button" className="photo-viewer-close" aria-label="Close" onClick={onClose}>
        <CloseIcon />
      </button>

      {count > 1 && (
        <>
          <button type="button" className="photo-viewer-nav previous" aria-label="Previous photo"
            disabled={index === 0} onClick={() => setIndex(current => current - 1)}>
            <ChevronLeftIcon />
          </button>
          <button type="button" className="photo-viewer-nav next" aria-label="Next photo"
            disabled={index >= count - 1} onClick={() => setIndex(current => current + 1)}>
            <ChevronRightIcon />
          </button>
        </>
      )}

      <figure>
        <PostImage key={photo.id} user={user} id={photo.id} className="photo-viewer-image" alt={photo.caption || "Photo"} />
        {(photo.caption || count > 1) && (
          <figcaption>
            {count > 1 && <span className="photo-viewer-count">{index + 1} / {count}</span>}
            {photo.caption && <span>{photo.caption}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

export default PhotoViewer;
