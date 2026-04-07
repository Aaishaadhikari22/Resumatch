import { Navigate } from "react-router-dom";

export default function EmployerProtectedRoute({ children }) {
  const employerToken = localStorage.getItem("employerToken");

  if (!employerToken) {
    return <Navigate to="/employer/login" />;
  }

  return children;
}
