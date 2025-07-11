import { SignupClub } from '../components/signupClub/SignupClub';
import { Link } from 'react-router';

export default function RegisterClub() {
    return (
        <>
            <Link to="/">Back</Link>
            <h2>Verein Registrieren</h2>
            <SignupClub />
        </>
    )
}
