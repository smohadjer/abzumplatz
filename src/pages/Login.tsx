import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <p>Wenn Sie noch keinen Account bei abzumplatz.de besitzen, müssen Sie sich zunächst <Link to="/register">registrieren</Link>.</p>
            <Login />
        </>

    )
}
