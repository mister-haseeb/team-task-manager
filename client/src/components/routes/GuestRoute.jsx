import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';

// Login/register pages: a logged-in user is sent on to where they were going.
export default function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner className="min-h-screen items-center" />;
  if (user) return <Navigate to={location.state?.from || '/'} replace />;
  return <Outlet />;
}
