import { Signup } from '../components/signup/Signup';
import { Link } from 'react-router';
import { Club } from '../types';

type Props = {
    clubs: Club[];
}

export default function Register(props: Props) {
    return (
        <>
            <p>Wenn Sie bereits ein Konto erstellt haben, sollten Sie sich <Link to="/login">anmelden</Link>.</p>
            <Signup clubs={props.clubs} />
        </>
    )
}
