import { Link } from 'react-router';
import { Signup } from '../components/signup/Signup';

export default function RegisterPlayer() {
    return (
        <>
            <p><Link className="icon icon--back" to="/">Zurück</Link></p>
            <h1>Spieler registrieren</h1>
            <Signup />
        </>
    )
}
