import { Link } from 'react-router';
import { Signup } from '../components/signup/Signup';

export default function RegisterPlayer() {
    return (
        <>
            <Link className="icon icon--back" to="/">Zurück</Link>
            <h2>Spieler registrieren</h2>
            <Signup />
        </>
    )
}
