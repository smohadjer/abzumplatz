import { Navigate } from 'react-router';
import { useLocation } from 'react-router'
import { useSelector } from 'react-redux'
import { RootState } from './store';

type Props = {
  children: React.ReactNode;
};

export const PublicRoute = ({ children }: Props) => {
  const location = useLocation();
  const auth = useSelector((state: RootState) => state.auth);
  const isLoggedin = auth.value;
  const role = auth.role;

  console.log('PublicRoute', {isLoggedin}, {role}, location.pathname)

  if (isLoggedin) {
    if (auth.club_id) {
      return <Navigate to="/reservations" replace />;
    } else {
      if (role === 'admin') {
        return <Navigate to="/register/club" replace />;
      } else {
        return <Navigate to="/select-club" replace />;
      }
    }
  }

  return children;
};
