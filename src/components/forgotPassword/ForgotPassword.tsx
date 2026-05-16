import { Form } from '../form/Form';
import formJson from './forgotPasswordForm.json';
import './forgotPassword.css';

export function ForgotPassword(props: { onSuccess: () => void }) {
    return (
        <Form
            formAttributes={formJson.form}
            initialData={formJson.fields}
            label="Passwort zurücksetzen"
            callback={props.onSuccess}
        />
    )
}
