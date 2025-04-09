import { Signup } from '../components/signup/Signup';
import { Link } from 'react-router';
import { Club } from '../types';

type Props = {
    clubs: Club[];
}

export default function Register(props: Props) {
    return (
        <>
            <h2>Neuen Account erstellen</h2>
            <p>Falls Sie noch kein Konto haben, registrieren Sie sich bitte über das folgende Formular. Melden Sie sich anschließend auf der <Link to="/login">Login-Seite</Link> an.</p>
            <Signup clubs={props.clubs} />
        </>
    )
}
