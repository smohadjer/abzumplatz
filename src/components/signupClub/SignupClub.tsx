import { Form } from '../form/Form';
import fields from './signupClubForm.json';
import './signupClub.css';
import { FieldProps } from '../../types';

export function SignupClub() {
    const normalizedFields: FieldProps[] = JSON.parse(JSON.stringify(fields));

    return (
        <>
            <h2>Verein registrieren</h2>
            <p></p>
            <Form
                classNames="signup"
                method="POST"
                action="/api/clubs"
                fields={normalizedFields}
                label="Registrieren"
            />
        </>
    )
}
