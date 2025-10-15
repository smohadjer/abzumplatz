import { Form } from '../form/Form';
import formJson from './forgotPasswordForm.json';
import './forgotPassword.css';

export function ForgotPassword() {
    return (
        <Form
            formAttributes={formJson.form}
            initialData={formJson.fields}
            label="Passwort zurücksetzen"
        />
    )
}
