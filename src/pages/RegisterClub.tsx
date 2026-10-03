import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import { Form } from '../components/form/Form';
import signupFormJson from '../components/signup/signupForm.json';
import signupClubFormJson from '../components/signupClub/signupClubForm.json';
import { Club, Field, PlanType } from '../types';
import { applyPlanConfigToFields } from '../planConfig';
import { PAID_PLAN_DURATION_LABEL, PLAN_CONFIG, getPlanName } from '../planConfig';
import { AppDispatch } from '../store';
import './register-club.css';

type SignupClubResponse = {
    club: Club;
}

const CLUB_SETTINGS_CONFIGURED_AFTER_REGISTRATION = new Set([
    'country',
    'start_hour',
    'end_hour',
    'timezone',
    'max_reservation_duration',
    'reservations_limit',
]);
const CLUB_ADDRESS_FIELDS = new Set([
    'address_line1',
    'postal_code',
    'city',
    'country',
]);

export default function RegisterClub() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null);
    const [isChoosingPlan, setIsChoosingPlan] = useState(true);
    const [formFields, setFormFields] = useState<Field[] | null>(null);

    const callback = (response: SignupClubResponse) => {
        const registeredEmail = formFields?.find(field => field.name === 'email')?.value;
        dispatch({
            type: 'clubs/upsert',
            payload: {
                value: response.club
            }
        });
        navigate('/login', {
            replace: true,
            state: {
                clubRegistrationSuccess: true,
                showAdminWelcome: true,
                email: typeof registeredEmail === 'string' ? registeredEmail : undefined,
            },
        });
    }

    const userFields = (signupFormJson.fields as Field[])
        .filter(field => field.name !== 'club_id');
    const privacyField = userFields.find(field => field.name === 'privacy');
    const clubFields = (signupClubFormJson.fields as Field[])
        .filter(field => field.name !== '_id')
        .map(field => CLUB_SETTINGS_CONFIGURED_AFTER_REGISTRATION.has(field.name)
            ? {
                ...field,
                type: 'hidden',
            }
            : field
        );
    const fields: Field[] = JSON.parse(JSON.stringify([
        ...userFields.filter(field => field.name !== 'privacy'),
        ...clubFields,
        ...(privacyField ? [privacyField] : [])
    ]));
    const formAttributes = {
        ...signupFormJson.form,
        action: '/api/signup-club'
    };

    const buildConfiguredFields = (planType: PlanType, sourceFields = fields) => {
        const configuredFields = applyPlanConfigToFields(
            sourceFields.map(field => {
                if (field.name === 'plan_type') {
                    return {
                        ...field,
                        hint: '',
                        hintByValue: undefined,
                        type: 'hidden',
                        value: planType
                    };
                }

                if (CLUB_ADDRESS_FIELDS.has(field.name)) {
                    return {
                        ...field,
                        hidden: planType === 'basic',
                        required: planType === 'pro',
                        ...(field.name === 'address_line1' && planType === 'pro'
                            ? {hint: 'Für die Rechnungsstellung erforderlich.'}
                            : {}),
                    };
                }

                return field;
            }),
            planType
        ).map(field => field.name === 'plan_type'
            ? {
                ...field,
                hint: '',
                hintByValue: undefined
            }
            : field
        );

        const hiddenFields = configuredFields.filter(field => field.type === 'hidden');
        const visibleFields = configuredFields.filter(field => field.type !== 'hidden');

        return [...hiddenFields, ...visibleFields];
    };

    const planCards = [
        {
            key: 'basic',
            title: PLAN_CONFIG.basic.label,
            price: 'Kostenlos',
            priceSuffix: '',
            features: PLAN_CONFIG.basic.features.map(feature => feature.label),
            footnote: 'Upgrade auf den Pro-Plan jederzeit möglich',
        },
        {
            key: 'pro',
            title: PLAN_CONFIG.pro.label,
            price: `${PLAN_CONFIG.pro.price} €`,
            priceSuffix: PAID_PLAN_DURATION_LABEL,
            features: PLAN_CONFIG.pro.features.map(feature => feature.label),
            footnote: 'Jährliche Zahlung per Rechnung. 30 Tage Widerrufsfrist mit vollständiger Erstattung; danach Kündigung zum Ende des Abrechnungsjahres ohne anteilige Erstattung.',
        }
    ];

    return (
        <>
            <>
            <p>
                {!isChoosingPlan && selectedPlanType ? (
                    <button
                        className="register-club-change-plan-button icon icon--back"
                        type="button"
                        onClick={() => setIsChoosingPlan(true)}
                    >
                        Zurück zur Planauswahl
                    </button>
                ) : (
                    <Link className="icon icon--back" to="/">Zur Startseite</Link>
                )}
            </p>
            <h1>Verein anlegen</h1>

            {isChoosingPlan && (
                <section className="register-club-plan-picker">
                    <div className="register-club-plan-grid">
                        {planCards.map(plan => (
                            <article key={plan.key} className={`register-club-plan-card register-club-plan-card--${plan.key}`}>
                                <p className="register-club-plan-name">
                                    {plan.title}-Plan <span className="register-club-plan-inline-price">- {plan.price}{plan.priceSuffix}</span>
                                </p>
                                <ul className="register-club-plan-features">
                                    {plan.features.map(feature => (
                                        <li key={feature}>{feature}</li>
                                    ))}
                                </ul>
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
                                        {plan.title}-Plan auswählen
                                    </button>
                                </p>
                                <p className="register-club-plan-footnote">{plan.footnote}</p>
                            </article>
                        ))}
                    </div>
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
                        showSubmitLoader
                    />
                </div>
            )}
            </>
        </>
    )
}
