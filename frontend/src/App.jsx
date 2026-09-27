import LeftSidebar from "./component/LeftSideBar";
import AuthForm from "./component/AuthFormsLogin";
import { useState } from "react";
import AISummary from "./component/AI_summary";
import MiddlePage from "./component/MiddlePage";
import "./App.css";

//<AuthForm />

 //<main className="main-content">
       //<h1>UniConnect</h1>

       // <button
       //   className="test-ai-button"
       //   onClick={() => setShowAISummary(true)}
       // >
       //   Test AI Summary
       // </button>
      //</main>

function App() {
  const [showAISummary, setShowAISummary] = useState(false);

  return (
    <div className="app">
      <LeftSidebar />
      <MiddlePage />
      {showAISummary && (
        <AISummary onClose={() => setShowAISummary(false)} />
      )}
    </div>
  );
}

export default App;