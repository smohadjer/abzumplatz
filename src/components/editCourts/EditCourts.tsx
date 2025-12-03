import { Form } from '../form/Form';
import formJson from './form.json';
import { Field, Court } from '../../types';

type Props = {
    label?: string;
    data?: any;
    callback?: Function;
}

export function EditCourts(props: Props) {
    const { label, data, callback } = props;

    // normalize form fields
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.map(field => {
        if (data && data.hasOwnProperty(field.name)) {
            field.value = data[field.name];
        }
        return field;
    });

    // add fields for status of courts
    const courtsOptions: any[] = [];
    data.courts?.forEach((_item: Court, index: number) => {
        courtsOptions.push(
            {
                label: `Platz ${index+1}`,
                value: `court_${index+1}`
            }
        )
    });
    const courtsValue = data.courts?.reduce((acc: string[], court: Court, index: number) => {
        if (court.status === 'active') {
            acc.push(`court_${index+1}`);
        }
        return acc;
    }, []);

    normalizedFields.push({
        name: 'courts',
        value: courtsValue,
        label: 'Aktive Plätze',
        type: 'checkbox',
        options: courtsOptions,
    });

    return (
        <Form
            classNames="signup"
            initialData={normalizedFields}
            formAttributes={formJson.form}
            label={label ?? 'Absenden'}
            pathSchema="/schema/courts.json"
            callback={callback}
        />
    )
}
