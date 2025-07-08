import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <p><Link to="/register">Spieler Registrieren</Link> | {' '}
                <Link to="/register/club">Verein Registrieren</Link>
            </p>
            <Login />
        </>

    )
}
