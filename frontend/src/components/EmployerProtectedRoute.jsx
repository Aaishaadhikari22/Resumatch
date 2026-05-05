import { Navigate } from "react-router-dom";
import { getRoleToken } from "../utils/auth";

export default function EmployerProtectedRoute({ children }) {
  const employerToken = getRoleToken("employer");

  if (!employerToken) {
    return <Navigate to="/employer/login" />;
  }

  return children;
}
