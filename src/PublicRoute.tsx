import { Navigate } from 'react-router';

type Props = {
    isLoggedin: boolean;
    children: React.ReactNode;
};

export const PublicRoute = ({ isLoggedin, children }: Props) => {
    if (isLoggedin) {
      return <Navigate to="/reservations" replace />;
    }

    return children;
};
