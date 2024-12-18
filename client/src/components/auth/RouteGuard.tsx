import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

export const ProtectedRoute = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const AuthRoute = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  if (user) {
    return <Navigate to="/channels/@me" replace />;
  }

  return <Outlet />;
};