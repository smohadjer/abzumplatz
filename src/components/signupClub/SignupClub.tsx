import { Form } from '../form/Form';
import fields from './signupClubForm.json';
import './signupClub.css';
import { FieldProps } from '../../types';

export function SignupClub() {
    const normalizedFields: FieldProps[] = JSON.parse(JSON.stringify(fields));

    return (
        <Form
            classNames="signup"
            method="POST"
            action="/api/clubs"
            fields={normalizedFields}
            label="Verein Registrieren"
        />
    )
}
