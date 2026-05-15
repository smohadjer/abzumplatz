import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <h1>Anmelden</h1>
            <Link className="icon icon--back" to="/">Zurück</Link>
            <Login />
        </>

    )
}
