import UserSidebar from "./UserSidebar";
import { Outlet } from "react-router-dom";

export default function UserLayout() {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
      <UserSidebar />
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 50px" }}>
        <Outlet />
      </div>
    </div>
  );
}
