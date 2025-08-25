import React from "react";
import {Navigate, useLocation} from "react-router-dom";
import {useAuth} from "../../providers/AuthProvider";

interface RequireRoleProps {
  role: "admin" | "store";
  children: React.ReactNode;
}

const RequireRole: React.FC<RequireRoleProps> = ({ role, children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated === undefined) {
    return null; // let parent loaders/spinners handle initial state
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (user?.role !== role) {
    // Show a simple 403 page; could be enhanced later
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access denied</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireRole;
