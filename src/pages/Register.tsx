import { Link } from 'react-router';
import { Signup } from '../components/signup/Signup';
import { Club } from '../types';

type Props = {
    clubs: Club[];
}

export default function Register(props: Props) {
    return (
        <>
            <Link to="/">Back</Link>
            <h2>Register</h2>
            <Signup clubs={props.clubs} />
        </>
    )
}
