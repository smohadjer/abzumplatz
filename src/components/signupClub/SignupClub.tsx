import { Form } from '../form/Form';
import formJson from './signupClubForm.json';
import { Field } from '../../types';
import { applyPlanConfigToFields } from '../../planConfig';

type Props = {
    label?: string;
    data?: any;
    callback?: Function;
}

export function SignupClub(props: Props) {
    const { label, data, callback } = props;
    const planType: 'free' | 'paid' = data?.plan_type === 'paid' ? 'paid' : 'free';

    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    const normalizedData = data ? structuredClone(data) : null;
    if (normalizedData) {
        normalizedData.courts_count = data.courts.length;
    }

    normalizedFields.forEach(field => {
        if (normalizedData && Object.prototype.hasOwnProperty.call(normalizedData, field.name)) {
            field.value = normalizedData[field.name];
        }
    });

    const configuredFields = applyPlanConfigToFields(normalizedFields, planType);

    return (
        <Form
            classNames="signup"
            initialData={configuredFields}
            formAttributes={formJson.form}
            label={label ?? 'Absenden'}
            pathSchema="/schema/club.json"
            callback={callback}
        />
    )
}
