<<<<<<< HEAD
import LeftSidebar from "./component/LeftSidebar";
import RightSideBar from "./component/RightSideBar";
import AuthFormsLogin from "./component/AuthFormsLogin";
import "./App.css";

function App() {
  return (
    <div className="app">
      <LeftSidebar />
      <AuthFormsLogin />

      <main className="main-content">
        <h1>UniConnect</h1>
      </main>

      <RightSideBar />
=======
import { useState } from "react";

import LeftSidebar from "./component/LeftSideBar";
import Explore from "./component/Explore";
import AISummary from "./component/AI_summary";

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

      {showAISummary && (
        <AISummary
          onClose={() => setShowAISummary(false)}
        />
      )}

>>>>>>> origin/develop
    </div>
  );
}

export default App;