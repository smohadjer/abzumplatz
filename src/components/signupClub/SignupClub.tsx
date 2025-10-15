import { Form } from '../form/Form';
import formJson from './signupClubForm.json';

export function SignupClub() {
    return (
        <Form
            classNames="signup"
            initialData={formJson.fields}
            formAttributes={formJson.form}
            label="Verein Registrieren"
            pathSchema="/schema/club.json"
        />
    )
}
