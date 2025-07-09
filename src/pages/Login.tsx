import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <div className="navbar">
                <span>Spieler Anmelden</span> | {' '}
                <Link to="/register">Spieler Registrieren</Link> | {' '}
                <Link to="/register/club">Verein Registrieren</Link>
            </div>
            <Login />
        </>

    )
}
