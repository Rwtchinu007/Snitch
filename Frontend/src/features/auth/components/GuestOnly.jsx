import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";

// Keeps logged-in users away from /login and /register
const GuestOnly = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  if (user) {
    const fallback = user.role === "seller" ? "/seller/dashboard" : "/";
    return <Navigate to={location.state?.from?.pathname || fallback} replace />;
  }
  return children;
};

export default GuestOnly;
