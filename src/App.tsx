import { Routes, Route, Link, Navigate } from 'react-router';
import Home from "./pages/Home";
import Register from "./pages/Register";
import LoginPage from "./pages/Login";
import About from "./pages/About";
import Layout from "./pages/Layout";
import Test from "./pages/Test";
import Myself from "./pages/Myself";
import NotFound from "./pages/NotFound";
import './App.css';

export default function App() {
    return (
        <Routes>
             <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about">
                    <Route index element={<About />} />
                    <Route path=":id" element={<Test />} />
                    <Route path="saeid" element={<Myself />} />
                </Route>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFound />} />
             </Route>
        </Routes>
    );
}


