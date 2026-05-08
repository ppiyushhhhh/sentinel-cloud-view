import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
