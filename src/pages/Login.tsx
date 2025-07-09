import { Login } from '../components/login/Login';
import { Link } from 'react-router';

export default function LoginPage() {
    return (
        <>
            <Link to="/">Back</Link>
            <h2>Anmelden</h2>
            <Login />
        </>

    )
}
