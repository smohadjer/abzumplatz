import { Signup } from '../components/signup/Signup';
import { Link } from 'react-router';
import { Club } from '../types';

type Props = {
    clubs: Club[];
}

export default function Register(props: Props) {
    return (
        <>
            <h2><Link to="/login">Anmelden</Link> | Registrieren</h2>
            <p>Falls Sie noch kein Konto haben, registrieren Sie sich bitte über das folgende Formular.</p>
            <Signup clubs={props.clubs} />
        </>
    )
}
