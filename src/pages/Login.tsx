import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <h2>Anmelden</h2>
            <p>Wenn Sie noch kein Konto in unserer App erstellt haben, sollten Sie sich zunächst <Link to="/register">hier registrieren</Link>.</p>
            <Login />
        </>

    )
}
