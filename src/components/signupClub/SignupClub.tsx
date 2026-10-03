import { Form } from '../form/Form';
import formJson from './signupClubForm.json';
import { Field } from '../../types';
import { applyPlanConfigToFields, getCoveredUntilFromPeriodEnd, getPlanName, normalizePlanType } from '../../planConfig';

type Props = {
    label?: string;
    data?: any;
    callback?: Function;
}

export function SignupClub(props: Props) {
    const { label, data, callback } = props;
    const selectedPlanType = data?.next_plan_type ?? data?.access_plan_type ?? 'basic';
    const accessPlanType = data?.access_plan_type ?? selectedPlanType;
    const planType = normalizePlanType(selectedPlanType);

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
            const coveredUntilLabel = data?.current_billing_period_end
                ? new Date(getCoveredUntilFromPeriodEnd(data.current_billing_period_end) ?? data.current_billing_period_end).toLocaleDateString('de-DE')
                : null;

            const scheduledPlanChangeNotice = coveredUntilLabel && data?.next_plan_type !== accessPlanType
                ? `${getPlanName(accessPlanType)} ist noch bis ${coveredUntilLabel} aktiv und wechselt danach zu ${getPlanName(data.next_plan_type)}.`
                : null;
            const refundDeadlineLabel = data?.pro_refund_eligible_until
                ? new Date(data.pro_refund_eligible_until).toLocaleDateString('de-DE')
                : null;
            const cancellationNotice = accessPlanType === 'pro'
                ? data?.pro_refund_eligible && refundDeadlineLabel
                    ? `Bei einem Wechsel zu Basic bis zum ${refundDeadlineLabel} endet Pro sofort; die vollständige Erstattung wird anschließend manuell bearbeitet.`
                    : `Eine Kündigung gilt zum Ende des bezahlten Abrechnungsjahres. Eine anteilige Erstattung ist nach Ablauf der 30-tägigen Widerrufsfrist ausgeschlossen.`
                : null;
            const specificPlanNotice = [
                scheduledPlanChangeNotice,
                cancellationNotice,
            ].filter(Boolean).join(' ');

            field.footnote = specificPlanNotice || 'Beim Wechsel zum Pro-Plan beginnt der jährliche Abrechnungszeitraum sofort.';
        }

        if (['address_line1', 'postal_code', 'city', 'country'].includes(field.name)) {
            field.required = planType === 'pro';
        }
    });

    const configuredFields = applyPlanConfigToFields(normalizedFields, planType);

    return (
        <Form
            classNames="signup"
            initialData={configuredFields}
            formAttributes={formJson.form}
            label={label ?? 'Speichern'}
            pathSchema="/schema/club.json"
            callback={callback}
        />
    )
}
