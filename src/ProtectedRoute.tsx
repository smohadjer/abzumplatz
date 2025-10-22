import { Navigate } from 'react-router';
import { useLocation } from 'react-router'

type ProtectedRouteProps = {
    isLoggedin: boolean;
    role: string;
    children: React.ReactNode;
};

export const ProtectedRoute = ({isLoggedin, role, children}: ProtectedRouteProps) => {
    const location = useLocation();

    if (!isLoggedin) {
        return <Navigate to="/" replace />;
    }

    if (role !== 'admin' && location.pathname === '/admin' ) {
        return <Navigate to="/reservations" replace />;
    }

    return children;
};
