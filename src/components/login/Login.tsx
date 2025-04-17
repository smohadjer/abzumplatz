import { Form } from '../form/Form';
import { Link } from 'react-router';
import fields from './loginForm.json';
import './Login.css';

export function Login() {
    return (
        <>
            <h2>Anmelden</h2>
            <Form
                classNames="form-login"
                method="POST"
                action="/api/login"
                fields={fields}
                label="Anmelden"
            />
            <p><Link to="/forgot-password">Passwort vergeßen?</Link></p>
        </>

    )
}
