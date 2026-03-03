import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Map each role to its default home route */
function getRoleHome(role) {
  switch (role) {
    case 'admin': return '/admin';
    case 'higher_authority': return '/higher';
    case 'ward_authority': return '/authority';
    default: return '/dashboard';
  }
}

export { getRoleHome };

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-navy"></div>
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );

  // No token / no user → login
  if (!user) return <Navigate to="/login" replace />;

  // Role not allowed → redirect to the user's own home (NEVER return null)
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  // Authorized → render children (NEVER return null)
  return children || <Navigate to={getRoleHome(user.role)} replace />;
}
