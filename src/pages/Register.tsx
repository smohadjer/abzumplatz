import { Signup } from '../components/signup/Signup';
import { Link } from 'react-router';

export default function Register() {
    return (
        <>
            <h1>Register</h1>
            <p><Link to="/login">Login</Link></p>
            <Signup />
        </>
    )
}
