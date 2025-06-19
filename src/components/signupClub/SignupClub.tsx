import { Form } from '../form/Form';
import fields from './signupClubForm.json';
import './signupClub.css';
import { Club, FieldProps } from '../../types';

type Props = {

}

export function SignupClub(props: Props) {
    console.log('signp club')

    const normalizedFields: FieldProps[] = JSON.parse(JSON.stringify(fields));

    return (
        <>
            <h2>Verein registrieren (kostenlos)</h2>
            <p></p>
            <Form
                classNames="signup"
                method="POST"
                action="/api/signup"
                fields={normalizedFields}
                label="Registrieren"
            />
        </>
    )
}
