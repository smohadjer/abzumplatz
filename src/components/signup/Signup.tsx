import { Form } from '../form/Form';
import fields from './signupForm.json';
import './Signup.css';
import { Club, FieldProps } from '../../types';

type Props = {
    clubs: Club[];
}

export function Signup(props: Props) {
    const clubs = props.clubs.map(club => {
        return {
            name: club.name,
            value: club._id,
        }
    });

    const normalizedFields: FieldProps[] = JSON.parse(JSON.stringify(fields));
    normalizedFields.map(field => {
        if (field.id === 'club_id' && field.options) {
            field.options.push(...clubs);
        }
        return field;
    });

    return (
        <Form
            method="POST"
            action="/api/signup"
            fields={normalizedFields}
            label="Register"
        />
    )
}
