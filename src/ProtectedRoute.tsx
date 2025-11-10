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

    console.log('ProtectedRoute', {isLoggedin}, {role}, location.pathname)

    if (!isLoggedin) {
        return <Navigate to="/" replace />;
    } else {
        if (!auth.club_id) {
            console.warn('club id is not set yet...');
            if (role === 'admin') {
                if (location.pathname !== '/register/club') {
                    return <Navigate to="/register/club" replace />;
                }
            } else {
                if (location.pathname !== '/select-club') {
                    return <Navigate to="/select-club" replace />;
                }
            }
        }

        if (role !== 'admin' && location.pathname === '/admin' ) {
            console.log('redirecting non-admin user to /reservations page');
            return <Navigate to="/reservations" replace />;
        }

        if (location.pathname === '/select-club' && auth.club_id) {
            console.log('redirecting user to /reservations page');
            return <Navigate to="/reservations" replace />;
        }

        return children;
    }
};
