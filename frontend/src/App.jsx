
import LeftSidebar from "./components/LeftSidebar";
import AuthForm from "./component/AuthFormsLogin"; 
import AuthFormSign from "./component/AuthFormsLogin";

import { useState } from "react";

import LeftSidebar from "./component/LeftSideBar";
import AISummary from "./component/AI_summary";


import "./App.css";

function App() {
  const [showAISummary, setShowAISummary] = useState(false);

  return (
    <div className="app">
     


     
      <LeftSidebar />
      <AuthForm />
     
      <main className="main-content">
        <h1>UniConnect</h1>

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
    </div>
  );
}

export default App;