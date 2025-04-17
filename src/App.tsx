import {isAuthenticated} from './utils/utils';
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store';
import Home from './pages/Home';
import Register from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoginPage from './pages/Login';
import Layout from './pages/Layout';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { Loader } from './components/loader/Loader';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import { Club } from './types';
import './app.css';

export default function App() {
    const [initialized, setInitialized] = useState(false);
    const [clubs, setClubs] = useState<Club[]>([]);
    const auth = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    useEffect(() => {
        async function getAuth() {
            const authenticated = await isAuthenticated();
            const clubs = await fetch('api/clubs');
            const clubsData: Club[] = await clubs.json();
            setClubs(clubsData);
            const club = clubsData.find(club => club._id === authenticated.club_id);
            if (authenticated.error) {
                console.log('user is not logged-in, fetching all events...');
                //dispatch(logout());
            } else {
                // user is logged-in, fetching only his events
                dispatch({type: 'auth/login', payload: {
                    value: true,
                    first_name: authenticated.first_name,
                    last_name: authenticated.last_name,
                    _id: authenticated._id,
                    club
                }});
            }
            setInitialized(true);
        }

        getAuth();
    }, []);

    return (
        initialized ?
        <Routes>
             <Route element={<Layout />}>
                <Route path="/" element={
                    <ProtectedRoute isLoggedin={auth.value}>
                        <Home />
                    </ProtectedRoute>
                }/>
                <Route path="/register" element={
                    <PublicRoute isLoggedin={auth.value}>
                        <Register clubs={clubs} />
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
                <Header />
                <main>
                    <div className="splash">
                        <Loader size="big" text="Vereinsdaten werden geladen" />
                    </div>
                </main>
                <Footer />
            </>
        )
    );
}


