import LeftSidebar from "./component/LeftSideBar";
import Explore from "./component/Explore";

import "./App.css";

function App() {
  return (
    <div className="app">

      <LeftSidebar />

      <main className="main-content">

        <Explore />

      </main>

    </div>
  );
}

export default App;