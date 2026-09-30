import LeftSidebar from "./component/LeftSideBar";
import Profile from "./pages/Profile/Profile";

import "./App.css";

function App() {
  return (
    <div className="app">

      <LeftSidebar />

      <main className="main-content">
        <Profile />
      </main>

    </div>
  );
}

export default App;