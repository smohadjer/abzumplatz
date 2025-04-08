import { Routes, Route } from 'react-router';
import Home from "./pages/Home";
import Register from "./pages/Register";
import LoginPage from "./pages/Login";
import About from "./pages/About";
import Layout from "./pages/Layout";
import Test from "./pages/Test";
import Myself from "./pages/Myself";
import NotFound from "./pages/NotFound";
import {isAuthenticated} from './utils/utils';
import './App.css';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store';
import { Loader } from './components/loader/Loader';

export default function App() {
    const [initialized, setInitialized] = useState(false);
    const [clubs, setClubs] = useState([]);
    const auth = useSelector((state: RootState) => state.auth.value);
    const dispatch = useDispatch();

   console.log('auth:', auth);

    useEffect(() => {
        async function getAuth() {
            console.log('authenticating')
            const authenticated = await isAuthenticated();

            const clubs = await fetch('api/clubs');
            const clubsData = await clubs.json();
            console.log('clubs:', clubsData);
            setClubs(clubsData);

            if (authenticated.error) {
                console.log('error');
                // user is not logged-in, fetching all events
                //dispatch(logout());
            } else {
                console.log('success', authenticated);
                // user is logged-in, fetching only his events
                dispatch({type: 'auth/login', payload: {
                    value: true,
                    first_name: authenticated.first_name,
                    last_name: authenticated.last_name,
                    _id: authenticated._id,
                    club_id: authenticated.club_id,
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
                    <ProtectedRoute isLoggedin={auth}>
                        <Home clubs={clubs} />
                    </ProtectedRoute>
                }/>
                <Route path="/about">
                    <Route index element={<About />} />
                    <Route path=":id" element={<Test />} />
                    <Route path="saeid" element={<Myself />} />
                </Route>
                <Route path="/register" element={
                    <PublicRoute isLoggedin={auth}>
                        <Register clubs={clubs} />
                    </PublicRoute>
                } />
                <Route path="/login" element={
                    <PublicRoute isLoggedin={auth}>
                        <LoginPage />
                    </PublicRoute>
                } />
                <Route path="*" element={<NotFound />} />
             </Route>
        </Routes> : <Loader />
    );
}


