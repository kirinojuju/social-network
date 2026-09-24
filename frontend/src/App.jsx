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
    </div>
  );
}

export default App;