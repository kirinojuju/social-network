import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "../component/LeftSideBar";
import RightSideBar from "../component/RightSideBar";

function Layout() {
  const location = useLocation();
  const hideRightSidebar = location.pathname === "/profile";

  return (
    <div className="app">
      <LeftSidebar />
      <main className={`main-content ${hideRightSidebar ? "full-width" : ""}`}>
        <Outlet />
      </main>
      {!hideRightSidebar && <RightSideBar />}
    </div>
  );
}

export default Layout;