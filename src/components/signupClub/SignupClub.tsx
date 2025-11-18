import { Form } from '../form/Form';
import formJson from './signupClubForm.json';
import { Field } from '../../types';

type Props = {
    label: string;
    data?: any;
    callback?: Function;
}

export function SignupClub(props: Props) {
    const { label, data, callback } = props;

    // normalize form fields
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.map(field => {
        if (data && data.hasOwnProperty(field.name)) {
            field.value = data[field.name];
        }
        return field;
    });

    return (
        <Form
            classNames="signup"
            initialData={normalizedFields}
            formAttributes={formJson.form}
            label={label}
            pathSchema="/schema/club.json"
            callback={callback}
        />
    )
}
