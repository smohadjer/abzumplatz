import { SignupClub } from '../components/signupClub/SignupClub';
import { Link } from 'react-router';

export default function RegisterClub() {
    return (
        <>
            <p>Wenn Sie sich als Spieler registrieren möchten, sollten Sie ein <Link to="/register">Benutzerkonto erstellen</Link>.</p>
            <SignupClub />
        </>
    )
}
