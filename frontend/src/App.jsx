
import { useState } from "react";

import LeftSidebar from "./component/LeftSideBar";
import Explore from "./component/Explore";
import AISummary from "./component/AI_summary";
import RightSideBar from "./component/RightSideBar";

import "./App.css";

function App() {
  const [showAISummary, setShowAISummary] = useState(false);

  return (
    <div className="app">

      <LeftSidebar />

      <main className="main-content">

        <Explore />

        {/* Temporary button to test AI Summary */}
        <button
          className="test-ai-button"
          onClick={() => setShowAISummary(true)}
        >
          Test AI Summary
        </button>

      </main>

       <RightSideBar />

      {showAISummary && (
        <AISummary
          onClose={() => setShowAISummary(false)}
        />
      )}

    </div>
  ); 
}

export default App;