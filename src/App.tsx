import {isAuthenticated} from './utils/utils';
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store';
import Home from './pages/Home';
import Reservations from './pages/Reservations';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import Register from './pages/Register';
import RegisterClub from './pages/RegisterClub';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoginPage from './pages/Login';
import Layout from './pages/Layout';
import LayoutPrivate from './pages/LayoutPrivate';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { Loader } from './components/loader/Loader';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import { Club } from './types';
import './app.css';

type Payload = {
    first_name: string;
    last_name: string;
    email: string;
    club_id: string;
    role: string;
    _id: string;
    error?: string;
};

export default function App() {
    const [initialized, setInitialized] = useState(false);
    const auth = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const dispatch = useDispatch();

    useEffect(() => {
        async function getData() {
            // fetch clubs and save it to store
            const clubs = await fetch('/api/clubs');
            const clubsData: Club[] = await clubs.json();
            console.log(clubsData);
            dispatch({
                type: 'clubs/fetch',
                payload: {
                    value: clubsData
                }
            });

            // fetch auth user and save it to store
            const authenticated: Payload = await isAuthenticated();
            if (authenticated.error) {
                console.warn('Not logged-in!');
            } else {
                console.log('User is logged-in', authenticated)
                // user is logged-in
                dispatch({type: 'auth/login', payload: {
                    value: true,
                    first_name: authenticated.first_name,
                    last_name: authenticated.last_name,
                    email: authenticated.email,
                    _id: authenticated._id,
                    club_id: authenticated.club_id,
                    role: authenticated.role
                }});
            }

            setInitialized(true);
        }

        getData();
    }, []);

    return (
        initialized ?
        <Routes>
            <Route element={<LayoutPrivate />}>
                <Route path="/reservations" element={
                    <ProtectedRoute isLoggedin={auth.value}>
                        <Reservations />
                    </ProtectedRoute>
                }/>
                <Route path="/profile" element={
                    <ProtectedRoute isLoggedin={auth.value}>
                        <Profile />
                    </ProtectedRoute>
                }/>
                <Route path="/bookings" element={
                    <ProtectedRoute isLoggedin={auth.value}>
                        <Bookings />
                    </ProtectedRoute>
                }/>
            </Route>
            <Route element={<Layout />}>
                <Route path="/" element={
                    <PublicRoute isLoggedin={auth.value}>
                        <Home />
                    </PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute isLoggedin={auth.value}>
                        <Register clubs={clubs} />
                    </PublicRoute>
                } />
                <Route path="/register/club" element={
                    <PublicRoute isLoggedin={auth.value}>
                        <RegisterClub />
                    </PublicRoute>
                } />
                <Route path="/login" element={
                    <PublicRoute isLoggedin={auth.value}>
                        <LoginPage />
                    </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                    <PublicRoute isLoggedin={auth.value}>
                        <ForgotPasswordPage />
                    </PublicRoute>
                } />
                <Route path="/reset-password" element={
                    <PublicRoute isLoggedin={auth.value}>
                        <ResetPasswordPage />
                    </PublicRoute>
                } />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes> : (
            <>
                <Header route="public" />
                <main>
                    <div className="splash">
                        <Loader size="big" text="Daten werden geladen..." />
                    </div>
                </main>
                <Footer />
            </>
        )
    );
}


