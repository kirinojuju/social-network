import { useEffect, useRef, useState } from "react";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Avatar from "./Avatar";
import MessageImage from "./MessageImage";
import { listMessages, markConversationRead, sendMessage } from "../messages/client";
import { prepareChatImage } from "../images/prepare";
import { mergeNewestComments } from "../posts/merge-comments";
import { useAutoRefresh } from "../live/useAutoRefresh";
import "./Chatbox.css";

function PendingPhoto({ url, onRemove }) {
  return (
    <div className="chatbox-pending">
      <img src={url} alt="Photo to send" />
      <button type="button" aria-label="Remove photo" onClick={onRemove}>
        <CloseOutlinedIcon fontSize="small" />
      </button>
    </div>
  );
}

function Chatbox({ user, target, onClose, onOpenProfile }) {
  // Newest first, as returned by the server; rendered in reverse.
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const photoInput = useRef(null);
  const photoUrl = useRef(null);

  function choosePhoto(file) {
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = file ? URL.createObjectURL(file) : null;
    setPhoto(file ? { file, url: photoUrl.current } : null);
  }

  useEffect(() => () => {
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
  }, []);
  const olderLoaded = useRef(false);
  const newestId = messages[0]?.id;

  async function refresh(signal) {
    try {
      const result = await listMessages(user, target.id, null, { signal });
      if (signal?.aborted) return;
      setMessages(items => olderLoaded.current ? mergeNewestComments(items, result.messages) : result.messages);
      if (!olderLoaded.current) setCursor(result.next_cursor);
      setError("");
      if (result.messages.some(message => !message.from_me && !message.read_at)) {
        markConversationRead(user, target.id).catch(() => {});
      }
    } catch (failure) {
      if (!signal?.aborted) setError(failure.message);
    } finally {
      if (!signal?.aborted) setLoaded(true);
    }
  }

  useAutoRefresh(refresh, 4000, true, target.id);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [newestId]);

  function keepNearBottom() {
    const list = listRef.current;
    if (list && list.scrollHeight - list.scrollTop - list.clientHeight < 250) list.scrollTop = list.scrollHeight;
  }

  async function loadOlder() {
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const result = await listMessages(user, target.id, cursor);
      olderLoaded.current = true;
      setMessages(items => [...items, ...result.messages.filter(message => !items.some(item => item.id === message.id))]);
      setCursor(result.next_cursor);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && !photo) || sending) return;
    setSending(true);
    setError("");
    try {
      const image = photo ? await prepareChatImage(photo.file) : null;
      const message = await sendMessage(user, target.id, { content: text, image });
      setMessages(items => [message, ...items]);
      setDraft("");
      choosePhoto(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chatbox" role="dialog" aria-label={`Chat with ${target.name}`}>
      <div className="chatbox-header">
        <button type="button" className="chatbox-person" onClick={() => onOpenProfile(target.id)}>
          <Avatar user={user} userId={target.id} className="chatbox-avatar" />
          <span className="chatbox-name">{target.name}</span>
        </button>
        <button type="button" className="chatbox-close" aria-label="Close chat" onClick={onClose}>
          <CloseOutlinedIcon fontSize="small" />
        </button>
      </div>

      <div className="chatbox-messages" ref={listRef} aria-live="polite">
        {cursor && (
          <button type="button" className="chatbox-older" disabled={loadingOlder} onClick={loadOlder}>
            {loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {!loaded && <p className="chatbox-empty" role="status">Loading messages…</p>}
        {loaded && messages.length === 0 && !error && (
          <p className="chatbox-empty">Say hello to start the conversation.</p>
        )}
        {[...messages].reverse().map(message => (
          <div key={message.id} className={`chatbox-row ${message.from_me ? "me" : "them"}`}
            title={new Date(message.created_at).toLocaleString()}>
            {!message.from_me && <Avatar user={user} userId={target.id} className="chatbox-bubble-avatar" />}
            <div className="chatbox-content">
              {message.has_image && <MessageImage user={user} messageId={message.id} onLoad={keepNearBottom} />}
              {message.content && <span className="chatbox-bubble">{message.content}</span>}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="chatbox-error" role="alert">{error}</p>}

      {photo && <PendingPhoto url={photo.url} onRemove={() => choosePhoto(null)} />}

      <form className="chatbox-input" onSubmit={submit}>
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files[0];
            e.target.value = "";
            if (file) choosePhoto(file);
          }}
        />
        <button type="button" className="chatbox-icon-btn" aria-label="Add a photo" disabled={sending}
          onClick={() => photoInput.current?.click()}>
          <ImageOutlinedIcon fontSize="small" />
        </button>
        <input
          type="text"
          aria-label={`Message ${target.name}`}
          placeholder="Aa"
          maxLength={2000}
          value={draft}
          disabled={sending}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="chatbox-icon-btn" aria-label="Send message"
          disabled={sending || (!draft.trim() && !photo)}>
          <SendOutlinedIcon fontSize="small" />
        </button>
      </form>
    </div>
  );
}

export default Chatbox;
