import { Form } from '../form/Form';
import fields from './resetPasswordForm.json';
import { InputProps, PasswordProps } from '../../types';
import { useSearchParams } from 'react-router';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('token');

    if (!resetToken) {
        return;
    }

    const resetTokenField: InputProps = {
        id: 'resetToken',
        type: 'hidden',
        value: resetToken
    }

    const normalizedFields: PasswordProps[] = JSON.parse(JSON.stringify(fields));
    normalizedFields.push(resetTokenField);

    return (
        <Form
            classNames="reset-password"
            method="POST"
            action="/api/reset-password"
            fields={normalizedFields}
            label="Passwort zurücksetzen"
        />
    )
}
