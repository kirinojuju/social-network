import { useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import PostImage from "../../posts/PostImage";
import "./PhotoViewer.css";

function PhotoViewer({ user, post, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label="Photo"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <button type="button" className="photo-viewer-close" aria-label="Close" onClick={onClose}>
        <CloseIcon />
      </button>
      <figure>
        <PostImage user={user} id={post.image_id} className="photo-viewer-image" alt={post.content || "Photo"} />
        {post.content && <figcaption>{post.content}</figcaption>}
      </figure>
    </div>
  );
}

export default PhotoViewer;
