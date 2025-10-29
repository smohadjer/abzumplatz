import { Link } from 'react-router';
import { Signup } from '../components/signup/Signup';

export default function Register() {
    return (
        <>
            <Link className="icon icon--back" to="/">Zurück</Link>
            <h2>Register</h2>
            <Signup />
        </>
    )
}
