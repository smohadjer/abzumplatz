import { Form } from '../form/Form';
import formJson from './forgotPasswordForm.json';
import './forgotPassword.css';

const isValidEmail = (value: unknown) => typeof value === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function ForgotPassword(props: { onSuccess: () => void }) {
    return (
        <Form
            formAttributes={formJson.form}
            initialData={formJson.fields}
            label="Passwort zurücksetzen"
            callback={props.onSuccess}
            isSubmitDisabled={fields => !isValidEmail(fields.find(field => field.name === 'email')?.value)}
        />
    )
}
