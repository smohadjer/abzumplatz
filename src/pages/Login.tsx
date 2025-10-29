import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <Link className="icon icon--back" to="/">Zurück</Link>
            <h2>Anmelden</h2>
            <Login />
        </>

    )
}
