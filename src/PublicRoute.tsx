import { Navigate } from 'react-router';
import { useSelector } from 'react-redux'
import { RootState } from './store';

type Props = {
  children: React.ReactNode;
};

export const PublicRoute = ({ children }: Props) => {
  const auth = useSelector((state: RootState) => state.auth);
  const isLoggedin = auth.value;

  // console.log('PublicRoute', {isLoggedin}, {role}, location.pathname)

  if (isLoggedin) {
    return <Navigate to="/reservations" replace />;
  }

  return children;
};
