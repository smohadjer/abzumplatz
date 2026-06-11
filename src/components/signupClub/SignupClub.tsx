import { Form } from '../form/Form';
import formJson from './signupClubForm.json';
import { Field } from '../../types';
import { FREE_PLAN_MEMBERS_LIMIT, getMembersLimitForPlan } from '../../planConfig';

type Props = {
    label?: string;
    data?: any;
    callback?: Function;
}

export function SignupClub(props: Props) {
    const { label, data, callback } = props;
    const planType: 'free' | 'paid' = data?.plan_type === 'paid' ? 'paid' : 'free';
    const memberLimit = getMembersLimitForPlan(planType) ?? FREE_PLAN_MEMBERS_LIMIT;
    const planHints = {
        free: `Nur ${memberLimit} aktive Mitglieder zulässig`,
        paid: 'Keine Einschränkungen. Eine Rechnung wird erstellt und per E-Mail an den Admin des Vereins gesendet. Bei einem späteren Wechsel zum Free Plan vor Ablauf des Jahresabos erfolgt keine Rückerstattung.'
    };

    // normalize form fields
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    const normalizedData = data ? structuredClone(data) : null;
    if (normalizedData) {
        normalizedData.courts_count = data.courts.length;
    }

    normalizedFields.map(field => {
        if (normalizedData && normalizedData.hasOwnProperty(field.name)) {
            field.value = field.name === 'auto_renew'
                ? String(Boolean(normalizedData[field.name]))
                : normalizedData[field.name];
        }

        if (field.name === 'plan_type') {
            field.hintByValue = planHints;
            field.hint = planHints[planType];
        }

        if (field.name === 'auto_renew' && !data) {
            field.hidden = true;
        }

        return field;
    });

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
