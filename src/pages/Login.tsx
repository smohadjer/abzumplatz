import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <h2>Anmelden | <Link to="/register">Registrieren</Link></h2>
            <p>Wenn Sie noch keinen Account bei abzumplatz.de besitzen, müssen Sie sich zunächst registrieren.</p>
            <Login />
        </>

    )
}
