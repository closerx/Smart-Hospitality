import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, isAdmin, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0B1B3D] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-700">جاري التحقق من الصلاحيات والبيانات...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict role enforcement: if allowedRoles is provided, user must have one of those roles.
  // Prevent role cross-over/leakage (e.g. Admin shouldn't enter Tenant dashboard, Tenant shouldn't enter Admin or Owner dashboard)
  if (allowedRoles && allowedRoles.length > 0) {
    const effectiveRole = userProfile?.role || role;
    
    // If user's role is not in the allowed list, redirect them to their dedicated dashboard
    if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
      if (isAdmin || effectiveRole === 'admin') return <Navigate to="/admin" replace />;
      if (effectiveRole === 'owner') return <Navigate to="/owner-dashboard" replace />;
      if (effectiveRole === 'cleaner') return <Navigate to="/cleaner-dashboard" replace />;
      return <Navigate to="/tenant-dashboard" replace />;
    }
  }

  return <>{children}</>;
};
