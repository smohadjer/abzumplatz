import { Navigate } from 'react-router';
import { useLocation } from 'react-router'
import { useSelector } from 'react-redux'
import { RootState } from './store';

type ProtectedRouteProps = {
    children: React.ReactNode;
};

export const ProtectedRoute = ({children}: ProtectedRouteProps) => {
  const location = useLocation();
  const auth = useSelector((state: RootState) => state.auth);
  const isLoggedin = auth.value;
  const role = auth.role;

  console.log('ProtectedRoute')
  console.log({isLoggedin}, {role}, location.pathname);

    if (!isLoggedin) {
        return <Navigate to="/" replace />;
    }

    if (role !== 'admin' && location.pathname === '/admin' ) {
        console.log('redirecting user to /reservations page');
        return <Navigate to="/reservations" replace />;
    }

    if (location.pathname === '/select-club' && auth.club_id) {
        console.log('redirecting user to /reservations page');
        return <Navigate to="/reservations" replace />;
    }

    return children;
};
