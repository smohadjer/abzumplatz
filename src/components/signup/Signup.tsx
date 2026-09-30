import { Form } from '../form/Form';
import formJson from './signupForm.json';
import { useNavigate } from "react-router";
import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import { Field } from '../../types';
import { useSearchParams } from 'react-router';

export function Signup() {
    const navigate = useNavigate();
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const [searchParams] = useSearchParams();
    const invitedClubId = searchParams.get('club');
    const callback = async () => {
        // update users in state
        // dispatch({
        //     type: 'users/fetch',
        //     payload: {
        //         value: json.data
        //     }
        // });
        navigate('/login');
    }

    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    const clubField = normalizedFields.find(field => field.name === 'club_id');
    if (clubField) {
        clubField.hint = 'Falls Ihr Verein nicht in der Liste erscheint, können Sie sich trotzdem registrieren. Reservierungen sind erst möglich, sobald Ihr Verein ein Konto auf abzumplatz erstellt hat.';
        clubField.options = [
            {
                label: 'Verein auswählen',
                value: ''
            },
            ...clubs.filter(club => !club.deleted_at).map(club => ({
                label: club.name,
                value: club._id
            }))
        ];
        if (invitedClubId && clubs.some(club => club._id === invitedClubId && !club.deleted_at)) {
            clubField.value = invitedClubId;
            clubField.hint = 'Dieser Verein wurde durch Ihren Einladungslink vorausgewählt. Sie können die Auswahl bei Bedarf ändern.';
        }
    }

    return (
        <Form
            classNames="signup"
            initialData={normalizedFields}
            formAttributes={formJson.form}
            label="Registrieren"
            pathSchema="/schema/signup.json"
            callback={callback}
        />
    )
}
