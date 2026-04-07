import { Navigate } from "react-router-dom";

export default function UserProtectedRoute({ children }) {

  const userToken = localStorage.getItem("userToken");

  if (!userToken) {
    return <Navigate to="/user/login" />;
  }

  return children;
}
