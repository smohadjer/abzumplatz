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
    const isReservationRoute = ['/reservations', '/bookings'].includes(location.pathname);
    // console.log('ProtectedRoute', {isLoggedin}, {role}, location.pathname)

    if (!isLoggedin) {
        return <Navigate to="/" replace />;
    } else {
        if (auth.role !== 'admin' && location.pathname.startsWith('/admin')) {
            return <Navigate to="/reservations" replace />;
        }

        if (location.pathname === '/select-club' && auth.role === 'admin') {
            return <Navigate to="/admin" replace />;
        }

        if (auth.role !== 'admin' && isReservationRoute && !auth.club_id) {
            return <Navigate to="/select-club" replace />;
        }

        return children;
    }
};