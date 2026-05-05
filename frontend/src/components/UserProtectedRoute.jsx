import { Navigate } from "react-router-dom";
import { getRoleToken } from "../utils/auth";

export default function UserProtectedRoute({ children }) {
  const userToken = getRoleToken("user");

  if (!userToken) {
    return <Navigate to="/user/login" />;
  }

  return children;
}
