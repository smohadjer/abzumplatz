import { Form } from '../form/Form';
import fields from './loginForm.json';
import './Login.css';

export function Login() {
    return (
        <Form
            method="POST"
            action="/api/login"
            fields={fields}
            label="Login"
        />
    )
}
