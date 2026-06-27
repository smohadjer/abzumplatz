import { Form } from '../form/Form';
import formJson from './signupClubForm.json';
import { Field } from '../../types';
import { applyPlanConfigToFields, getCoveredUntilFromPeriodEnd, getPlanLevel, getPlanName, normalizePlanType } from '../../planConfig';

type Props = {
    label?: string;
    data?: any;
    callback?: Function;
}

export function SignupClub(props: Props) {
    const { label, data, callback } = props;
    const selectedPlanType = data?.next_plan_type ?? data?.access_plan_type ?? data?.plan_type;
    const accessPlanType = data?.access_plan_type ?? data?.plan_type;
    const planType = normalizePlanType(selectedPlanType);
    const downgradeLocked = Boolean(data?.downgrade_locked);

    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    const normalizedData = data ? structuredClone(data) : null;
    if (normalizedData) {
        normalizedData.courts_count = data.courts.length;
        normalizedData.plan_type = selectedPlanType;
    }

    normalizedFields.forEach(field => {
        if (normalizedData && Object.prototype.hasOwnProperty.call(normalizedData, field.name)) {
            field.value = normalizedData[field.name];
        }

        if (data?._id && field.name === 'plan_type') {
            if (downgradeLocked) {
                field.options = field.options?.map(option => ({
                    ...option,
                    disabled: typeof option.value === 'string' && getPlanLevel(option.value as 'basic' | 'pro' | 'elite') < getPlanLevel(accessPlanType)
                }));
            }
            const coveredUntilLabel = data?.current_billing_period_end
                ? new Date(getCoveredUntilFromPeriodEnd(data.current_billing_period_end) ?? data.current_billing_period_end).toLocaleDateString('de-DE')
                : null;

            const scheduledPlanChangeNotice = coveredUntilLabel && data?.next_plan_type !== accessPlanType
                ? `${getPlanName(accessPlanType)} ist noch bis ${coveredUntilLabel} aktiv und wechselt danach zu ${getPlanName(data.next_plan_type)}.`
                : null;
            const upgradeBillingNotice = coveredUntilLabel && accessPlanType !== data?.plan_type
                ? `${getPlanName(accessPlanType)} Zugriff ist bereits aktiv. Abgerechnet wird ${getPlanName(data.plan_type)} bis ${coveredUntilLabel}.`
                : null;
            const downgradeLockNotice = downgradeLocked
                ? 'Nach einem Upgrade ist ein Downgrade erst ab der nächsten Verlängerung möglich.'
                : null;
            const specificPlanNotice = [
                scheduledPlanChangeNotice,
                upgradeBillingNotice,
                downgradeLockNotice,
            ].filter(Boolean).join(' ');

            field.footnote = specificPlanNotice || 'Upgrade auf den Pro- oder Elite-Plan jederzeit möglich';
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