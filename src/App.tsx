import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store';
import { isAuthenticated } from './utils/utils';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// pages
import Home from './pages/Home';
import SelectClubPage from './pages/SelectClubPage';
import Reservations from './pages/Reservations';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import Register from './pages/Register';
import RegisterClub from './pages/RegisterClub';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoginPage from './pages/Login';
import Layout from './pages/Layout';
import NotFound from './pages/NotFound';
import Imprint from './pages/Imprint';

import { Loader } from './components/loader/Loader';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';

import { Club, JwtPayload } from './types';
import './app.css';

export default function App() {
    const [initialized, setInitialized] = useState(false);
    // const auth = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const dispatch = useDispatch();

    useEffect(() => {
        async function getData() {
            // fetch clubs and save it to store
            const clubs = await fetch('/api/clubs');
            const clubsData: Club[] = await clubs.json();
            dispatch({
                type: 'clubs/fetch',
                payload: {
                    value: clubsData
                }
            });

            // fetch logged-in user and save it to store
            const authenticated: JwtPayload = await isAuthenticated();
            if (authenticated.error) {
                console.log('Not logged-in!');
            } else {
                console.log('User is logged-in', authenticated)
                dispatch({type: 'auth/login', payload: {
                    value: true,
                    ...authenticated
                }});
            }

            setInitialized(true);
        }

        getData();
    }, []);

    return (
        initialized ?
        <Routes>
            <Route element={<Layout />}>
                <Route path="/reservations" element={
                    <ProtectedRoute>
                        <Reservations />
                    </ProtectedRoute>
                }/>
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }/>
                <Route path="/bookings" element={
                    <ProtectedRoute>
                        <Bookings />
                    </ProtectedRoute>
                }/>
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <Admin />
                    </ProtectedRoute>
                }/>
                <Route path="/register/club" element={
                    <ProtectedRoute>
                        <RegisterClub />
                    </ProtectedRoute>
                }/>
                <Route path="/select-club" element={
                    <ProtectedRoute>
                        <SelectClubPage clubs={clubs} />
                    </ProtectedRoute>
                }/>
                <Route path="/" element={
                    <PublicRoute>
                        <Home />
                    </PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } />
                <Route path="/login" element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                    <PublicRoute>
                        <ForgotPasswordPage />
                    </PublicRoute>
                } />
                <Route path="/reset-password" element={
                    <PublicRoute>
                        <ResetPasswordPage />
                    </PublicRoute>
                } />
                <Route path="/impressum" element={
                    <Imprint />
                } />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes> : (
            <>
                <Header />
                <main>
                    <div className="splash">
                        <Loader size="big" text="Loading..." />
                    </div>
                </main>
                <Footer />
            </>
        )
    );
}


