import { Form } from '../form/Form';
import { Link } from 'react-router';
import fields from './loginForm.json';
import './Login.css';

export function Login() {
    // deep clone fields array to avoid mutation during validation in form
    const loginFields = structuredClone(fields);
    return (
        <>
            <h2>Anmelden</h2>
            <Form
                classNames="form-login"
                method="POST"
                action="/api/login"
                fields={loginFields}
                label="Anmelden"
            />
            <p><Link to="/forgot-password">Passwort vergeßen?</Link></p>
        </>

    )
}
