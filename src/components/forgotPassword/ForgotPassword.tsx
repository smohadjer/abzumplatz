import { Form } from '../form/Form';
import fields from './forgotPasswordForm.json';
import './forgotPassword.css';

export function ForgotPassword() {
    return (
        <Form
            method="POST"
            action="/api/forgot-password"
            fields={fields}
            label="Passwort zurücksetzen"/>
    )
}
