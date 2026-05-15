import { Link } from 'react-router';
import { Signup } from '../components/signup/Signup';

export default function RegisterPlayer() {
    return (
        <>
            <h1>Spieler registrieren</h1>
            <Link className="icon icon--back" to="/">Zurück</Link>
            <Signup />
        </>
    )
}
