import { useState } from "react";

import LeftSidebar from "./component/LeftSideBar";
import Explore from "./component/Explore";
import AISummary from "./component/AI_summary";
import RightSideBar from "./component/RightSideBar";
import Chatbox from "./component/Chatbox";
import Profile from "./pages/Profile/Profile";

import "./App.css";

function App() {
  const [showAISummary, setShowAISummary] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="app">
      <LeftSidebar />

      <main className="main-content">
        {showProfile ? (
          <Profile />
        ) : (
          <>
            <Explore />
            <button className="test-ai-button" onClick={() => setShowAISummary(true)}>
              Test AI Summary
            </button>
          </>
        )}
      </main>

      <RightSideBar />

      {showChat && <Chatbox userName="User_Name" onClose={() => setShowChat(false)} />}
      <button className="test-chat-button" onClick={() => setShowChat(true)}>
        Test Chatbox
      </button>

      <button
        className="test-ai-button"
        style={{ bottom: 80 }}
        onClick={() => setShowProfile((v) => !v)}
      >
        {showProfile ? "Back to Explore" : "View Profile"}
      </button>

      {showAISummary && <AISummary onClose={() => setShowAISummary(false)} />}
    </div>
  );
}

export default App;