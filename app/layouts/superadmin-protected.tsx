import { Navigate, Outlet } from 'react-router';
import { useManageAuthStore } from '~/store/manageAuth';

/**
 * Layout component that protects routes requiring superadmin role.
 * Redirects non-superadmin users to the dashboard.
 */
export default function SuperadminProtected() {
  const userRole = useManageAuthStore((state) => state.role);

  // If user is not a superadmin, redirect to dashboard
  if (userRole !== 'superadmin') {
    return <Navigate to="/manage/dashboard" replace />;
  }

  // If user is superadmin, render child routes
  return <Outlet />;
}
