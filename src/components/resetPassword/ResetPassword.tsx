import { Form } from '../form/Form';
import formJson from './resetPasswordForm.json';
import { Field } from '../../types';
import { Link, useSearchParams, useNavigate } from 'react-router';

export function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('token');
    const callback = async () => {
        navigate('/login');
    }

    if (!resetToken) {
        return (
            <p className="error">Token not found! Please visit this page through link sent to your in email or request a <Link to="/forgot-password">new token</Link>.</p>
        )
    }

    const resetTokenField = {
        label: 'resetToken',
        name: 'resetToken',
        type: 'hidden',
        value: resetToken
    }

    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.push(resetTokenField);

    return (
        <Form
            pathSchema="/schema/resetPassword.json"
            classNames="reset-password"
            formAttributes={formJson.form}
            initialData={normalizedFields}
            label="Passwort zurücksetzen"
            callback={callback}
        />
    )
}
