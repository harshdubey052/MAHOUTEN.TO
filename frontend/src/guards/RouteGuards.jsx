import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

export function UserRoute({ children }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  if (!user) return <Navigate to="/login" replace />;
  if (!activeProfile) return <Navigate to="/profiles" replace />;
  return children;
}

export function AuthRequiredRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  if (user) return <Navigate to={activeProfile ? "/home" : "/profiles"} replace />;
  return children;
}

