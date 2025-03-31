import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <p>
                <strong>Login</strong> | {' '}
                <Link to="/register">Register</Link>
            </p>
            <Login />
        </>
    )
}
