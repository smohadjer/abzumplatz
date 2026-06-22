import { useState } from 'react';
import { useNavigate } from "react-router";
import { Link } from 'react-router';
import { Form } from '../components/form/Form';
import signupFormJson from '../components/signup/signupForm.json';
import signupClubFormJson from '../components/signupClub/signupClubForm.json';
import { Field, PlanType } from '../types';
import { applyPlanConfigToFields } from '../planConfig';
import { PAID_PLAN_DURATION_LABEL, PLAN_CONFIG, getPlanName } from '../planConfig';
import './register-club.css';

export default function RegisterClub() {
    const navigate = useNavigate();
    const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null);
    const [isChoosingPlan, setIsChoosingPlan] = useState(true);
    const [formFields, setFormFields] = useState<Field[] | null>(null);

    const callback = async () => {
        navigate('/login');
    }

    const userFields = (signupFormJson.fields as Field[])
        .filter(field => field.name !== 'club_id');
    const privacyField = userFields.find(field => field.name === 'privacy');
    const clubFields = (signupClubFormJson.fields as Field[])
        .filter(field => field.name !== '_id');
    const fields: Field[] = JSON.parse(JSON.stringify([
        ...userFields.filter(field => field.name !== 'privacy'),
        ...clubFields,
        ...(privacyField ? [privacyField] : [])
    ]));
    const formAttributes = {
        ...signupFormJson.form,
        action: '/api/signup-club'
    };

    const buildConfiguredFields = (planType: PlanType, sourceFields = fields) => applyPlanConfigToFields(
        sourceFields.map(field => field.name === 'plan_type'
            ? {
                ...field,
                hint: '',
                hintByValue: undefined,
                type: 'hidden',
                value: planType
            }
            : field),
        planType
    ).map(field => field.name === 'plan_type'
        ? {
            ...field,
            hint: '',
            hintByValue: undefined
        }
        : field
    );

    const planCards = [
        {
            key: 'basic',
            title: PLAN_CONFIG.basic.label,
            price: `${PLAN_CONFIG.basic.price} €`,
            priceSuffix: PAID_PLAN_DURATION_LABEL,
            members: `Bis zu ${PLAN_CONFIG.basic.membersLimit} aktive Mitglieder`,
        },
        {
            key: 'pro',
            title: PLAN_CONFIG.pro.label,
            price: `${PLAN_CONFIG.pro.price} €`,
            priceSuffix: PAID_PLAN_DURATION_LABEL,
            members: `Bis zu ${PLAN_CONFIG.pro.membersLimit} aktive Mitglieder`,
        },
        {
            key: 'elite',
            title: PLAN_CONFIG.elite.label,
            price: `${PLAN_CONFIG.elite.price} €`,
            priceSuffix: PAID_PLAN_DURATION_LABEL,
            members: 'Keine Begrenzung der aktiven Mitglieder',
        }
    ];

    return (
        <>
            <p>
                {!isChoosingPlan && selectedPlanType ? (
                    <button
                        className="register-club-back-button icon icon--back"
                        type="button"
                        onClick={() => setIsChoosingPlan(true)}
                    >
                        Zurück
                    </button>
                ) : (
                    <Link className="icon icon--back" to="/">Zurück</Link>
                )}
            </p>
            <h1>Verein Registrieren</h1>

            {isChoosingPlan && (
                <section className="register-club-plan-picker">
                    <div className="register-club-plan-grid">
                        {planCards.map(plan => (
                            <article key={plan.key} className={`register-club-plan-card register-club-plan-card--${plan.key}`}>
                                <p className="register-club-plan-name">{plan.title}</p>
                                <p className="register-club-plan-price">
                                    {plan.price}
                                    <span className="register-club-plan-price-suffix">{plan.priceSuffix}</span>
                                </p>
                                <p className="register-club-plan-members">{plan.members}</p>
                                <p className="register-club-plan-action">
                                    <button
                                        className="button-link register-club-plan-select-button"
                                        type="button"
                                        onClick={() => {
                                            const planType = plan.key as PlanType;
                                            setSelectedPlanType(planType);
                                            setFormFields(currentFields => buildConfiguredFields(planType, currentFields ?? fields));
                                            setIsChoosingPlan(false);
                                        }}
                                    >
                                        Plan auswählen
                                    </button>
                                </p>
                            </article>
                        ))}
                    </div>
                    <p className="register-club-plan-limit-note">
                        Das Mitgliederlimit begrenzt nur, wie viele Mitglieder gleichzeitig aktiv sein können. Wenn Ihr Verein bereits über dem Limit liegt, bleiben bestehende aktive Mitglieder erhalten, aber es können keine weiteren inaktiven oder neuen Mitglieder aktiviert werden, bis die Zahl der Vereinsmitglieder wieder unter das Limit des Plans fällt.
                    </p>
                </section>
            )}

            {selectedPlanType && formFields && (
                <div className={isChoosingPlan ? 'register-club-form-section register-club-form-section--hidden' : 'register-club-form-section'}>
                    <p className="register-club-selected-plan">Gewählter Plan: <strong>{getPlanName(selectedPlanType)}</strong></p>
                    <p className="register-club-form-intro">Mit der Registrierung eines Vereins werden Sie automatisch Administrator dieses Vereins und erhalten die Rechte, Spieler und alle Einstellungen Ihres Vereins zu verwalten.</p>
                    <Form
                        classNames="signup"
                        initialData={formFields}
                        formData={formFields}
                        onFormDataChange={setFormFields}
                        formAttributes={formAttributes}
                        label="Verein Registrieren"
                        pathSchema="/schema/signup-club.json"
                        callback={callback}
                    />
                </div>
            )}
        </>
    )
}
