import { useEffect, useState } from "react";
import { loadMessageImage } from "../messages/client";

function MessageImage({ user, messageId, onLoad }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = null;
    loadMessageImage(user, messageId, { signal: controller.signal }).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {});
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user, messageId]);

  if (!url) return <span className="chatbox-photo chatbox-photo-loading" aria-label="Loading photo" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" title="Open full size">
      <img className="chatbox-photo" src={url} alt="Photo in chat" onLoad={onLoad} />
    </a>
  );
}

export default MessageImage;
