import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardSkeleton } from '../components/common/DashboardSkeleton';
import { USER_ROLES } from '../config/constants';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-100 p-6 sm:p-10 max-w-7xl mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?role=${allowedRoles?.[0] || USER_ROLES.CONSUMER}`} state={{ from: location }} replace />;
  }

  // If specific roles are required, verify access
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their permitted default portal
    if (role === USER_ROLES.INDUSTRIAL) {
      return <Navigate to="/industrial" replace />;
    } else if (role === USER_ROLES.GOVERNMENT) {
      return <Navigate to="/government" replace />;
    } else {
      return <Navigate to="/consumer" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

