import { Signup } from '../components/signup/Signup';
import { Link } from 'react-router';
import { Club } from '../types';

type Props = {
    clubs: Club[];
}

export default function Register(props: Props) {
    return (
        <>
            <p>
                <Link to="/login">Login</Link> | {' '}
                <strong>Register</strong>
            </p>
            <Signup clubs={props.clubs} />
        </>
    )
}
