import { Form } from '../form/Form';
import formJson from './signupClubForm.json';
import { Field } from '../../types';

type Props = {
    label?: string;
    data?: any;
    callback?: Function;
}

export function SignupClub(props: Props) {
    const { label, data, callback } = props;

    // normalize form fields
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    if (data) {
        const normalizedData = structuredClone(data);
        normalizedData.courts_count = data.courts.length;
        normalizedFields.map(field => {
            if (normalizedData && normalizedData.hasOwnProperty(field.name)) {
                field.value = normalizedData[field.name];
            }
            return field;
        });
    }

    return (
        <Form
            classNames="signup"
            initialData={normalizedFields}
            formAttributes={formJson.form}
            label={label ?? 'Absenden'}
            pathSchema="/schema/club.json"
            callback={callback}
        />
    )
}
