import { Form } from '../form/Form';
import formJson from './signupForm.json';
import { Field, Club } from '../../types';

type Props = {
    clubs: Club[];
}

export function Signup(props: Props) {
    const clubs = props.clubs.map(club => {
        return {
            label: club.name,
            value: club._id,
        }
    });

    // normalize json by adding clubs data to clubs dropdown
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.map(field => {
        if (field.name === 'club_id' && field.options) {
            field.options.push(...clubs);
        }
        return field;
    });

    return (
        <Form
            classNames="signup"
            initialData={normalizedFields}
            formAttributes={formJson.form}
            label="Registrieren"
            pathSchema="/schema/signup.json"
        />
    )
}
