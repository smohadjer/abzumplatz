import { Routes, Route, Link, Navigate } from 'react-router';
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
import { login, logout } from './authSlice'
import { RootState } from './store';

export default function App() {
    const [initialized, setInitialized] = useState(false);
    const auth = useSelector((state: RootState) => state.auth.value);
    const dispatch = useDispatch();

    console.log({auth});

    useEffect(() => {
        async function getAuth() {
            console.log('authenticating')
            const authenticated = await isAuthenticated();

            if (authenticated.error) {
                // user is not logged-in, fetching all events
                dispatch(logout());
            } else {
                // user is logged-in, fetching only his events
                dispatch(login());
            }

            console.log('auth again', auth);
            setInitialized(true);
        }

        getAuth();
    })

    return (
        initialized ?
        <Routes>
             <Route element={<Layout />}>
                <Route path="/" element={
                    <ProtectedRoute isLoggedin={auth}>
                        <Home />
                    </ProtectedRoute>
                }/>
                <Route path="/about">
                    <Route index element={<About />} />
                    <Route path=":id" element={<Test />} />
                    <Route path="saeid" element={<Myself />} />
                </Route>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={
                    <PublicRoute isLoggedin={auth}>
                        <LoginPage />
                    </PublicRoute>
                } />
                <Route path="*" element={<NotFound />} />
             </Route>
        </Routes> : <>Loading</>
    );
}


