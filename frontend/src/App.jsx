import { useState } from "react";
import LeftSidebar from "./component/LeftSideBar";
import Explore from "./component/Explore";
import AISummary from "./component/AI_summary";
import RightSideBar from "./component/RightSideBar";
import Chatbox from "./component/Chatbox";


import "./App.css";

function App() {
  const [showAISummary, setShowAISummary] = useState(false);
  const [showChat, setShowChat] = useState(false); 

  return (
    <div className="app">

      <LeftSidebar />

      <main className="main-content">
        <Explore />

        <button
          className="test-ai-button"
          onClick={() => setShowAISummary(true)}
        >
          Test AI Summary
        </button>
      </main>

      <RightSideBar />

      {showChat && (
        <Chatbox userName="User_Name" onClose={() => setShowChat(false)} />
      )}
      <button
  className="test-chat-button"
  onClick={() => {
    console.log("clicked, current showChat:", showChat);
    setShowChat(true);
  }}
>
  Test Chatbox
</button>

      {showAISummary && (
        <AISummary onClose={() => setShowAISummary(false)} />
      )}
    </div>
  );
}

export default App;