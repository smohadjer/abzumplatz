import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <p><Link className="icon icon--back" to="/">Zurück</Link></p>
            <h1>Anmelden</h1>
            <Login />
        </>

    )
}
