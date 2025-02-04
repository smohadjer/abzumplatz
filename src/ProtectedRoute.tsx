import { Routes, Route, Link, Navigate } from 'react-router';

type ProtectedRouteProps = {
    isLoggedin: boolean;
    children: React.ReactNode;
};

export const ProtectedRoute = ({ isLoggedin, children }: ProtectedRouteProps) => {
    if (!isLoggedin) {
      return <Navigate to="/login" replace />;
    }

    return children;
};
