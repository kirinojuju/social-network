import { useState } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import "./Chatbox.css";

// TODO: replace with a real fetch of the conversation history once the
// backend endpoint exists, e.g. GET /api/conversations/:userId
function Chatbox({ userName = "User_Name", onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  // TODO: fetch existing messages on mount
  // useEffect(() => {
  //   fetch(`/api/conversations/${conversationId}/messages`)
  //     .then((res) => res.json())
  //     .then(setMessages);
  // }, [conversationId]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    // TODO: replace with a real POST to the backend, e.g.
    // fetch(`/api/conversations/${conversationId}/messages`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ text }),
    // })
    //   .then((res) => res.json())
    //   .then((saved) => setMessages((prev) => [...prev, saved]));

    setMessages((prev) => [...prev, { id: prev.length + 1, from: "me", text }]);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <AccountCircleOutlinedIcon className="chatbox-avatar" />
        <span className="chatbox-name">{userName}</span>
        <button type="button" className="chatbox-close" aria-label="Close chat preview" onClick={onClose}>
          <CloseOutlinedIcon fontSize="small" />
        </button>
      </div>

      <div className="chatbox-messages">
        <p className="chatbox-preview">Preview only — messages are not saved yet.</p>
        {messages.length === 0 ? (
          <p className="chatbox-empty">Say hello to start the conversation.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`chatbox-row ${m.from}`}>
              {m.from === "them" && (
                <AccountCircleOutlinedIcon className="chatbox-bubble-avatar" />
              )}
              <span className="chatbox-bubble">{m.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="chatbox-input">
        <button type="button" className="chatbox-icon-btn" aria-label="Attach file (coming soon)" disabled>
          <AttachFileOutlinedIcon fontSize="small" />
        </button>
        <input
          type="text"
          placeholder="Aa"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="chatbox-icon-btn" aria-label="Send preview message" onClick={sendMessage}>
          <SendOutlinedIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}

export default Chatbox;
