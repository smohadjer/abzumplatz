import { useNavigate } from "react-router";
import { Link } from 'react-router';
import { Form } from '../components/form/Form';
import signupFormJson from '../components/signup/signupForm.json';
import signupClubFormJson from '../components/signupClub/signupClubForm.json';
import { Field } from '../types';

export default function RegisterClub() {
    const navigate = useNavigate();

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

    return (
        <>
            <h1>Verein Registrieren</h1>
            <p><Link className="icon icon--back" to="/">Zurück</Link></p>
            <p>Als Administrator sollten Sie Ihren Verein registrieren, bevor Sie und die Spieler Reservierungen vornehmen können.</p>
            <Form
                classNames="signup"
                initialData={fields}
                formAttributes={formAttributes}
                label="Verein Registrieren"
                pathSchema="/schema/signup-club.json"
                callback={callback}
            />
        </>
    )
}
