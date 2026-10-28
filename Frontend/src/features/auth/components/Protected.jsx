import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import AuthLoader from "./AuthLoader";

const Protected = ({ children, role = "buyer" }) => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const location = useLocation();
  // Only block render if we have no user AND the initial auth check is still in-flight.
  // If the user is already in the store (e.g. just logged in), proceed immediately.
  if (loading && !user) {
    return <AuthLoader />;
  }
  if (!user) {
    // Remember where the user was headed so login can send them back
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  const userRole = user?.role?.trim().toLowerCase();
  const requiredRole = String(role).trim().toLowerCase();

  if (userRole !== requiredRole) {
    // Redirect sellers trying to access buyer routes to their dashboard
    if (userRole === "seller") return <Navigate to="/seller/dashboard" replace />;
    // Redirect buyers trying to access seller routes to home
    return <Navigate to="/" replace />;
  }
  return children;
};

export default Protected;
