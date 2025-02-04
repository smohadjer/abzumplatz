import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <h1>Login</h1>
            <p><Link to="/register">Register</Link></p>
            <Login />
        </>
    )
}
