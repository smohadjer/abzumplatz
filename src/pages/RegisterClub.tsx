import { SignupClub } from '../components/signupClub/SignupClub';
import { Link } from 'react-router';

export default function RegisterClub() {
    return (
        <>
            <div className="navbar">
                <Link to="/login">Spieler Anmelden</Link> | {' '}
                <Link to="/register">Spieler Registrieren</Link> | {' '}
                <span>Verein Registrieren</span>
            </div>
            <SignupClub />
        </>
    )
}
