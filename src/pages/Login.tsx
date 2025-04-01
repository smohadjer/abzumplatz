import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <p>
                <span>Login</span> | {' '}
                <Link to="/register">Register</Link>
            </p>
            <Login />
        </>
    )
}
