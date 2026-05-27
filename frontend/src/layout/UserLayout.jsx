import UserSidebar from "./UserSidebar";
import { Outlet } from "react-router-dom";

export default function UserLayout() {
  return (
    <div className="app-root" style={{ display: "flex", height: "100vh" }}>
      <UserSidebar />
      <div className="app-main-content" style={{ padding: "40px 50px" }}>
        <Outlet />
      </div>
    </div>
  );
}
