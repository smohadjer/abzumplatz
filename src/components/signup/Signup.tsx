import { Form } from '../form/Form';
import formJson from './signupForm.json';
import { useNavigate } from "react-router";
import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import { Field } from '../../types';

export function Signup() {
    const navigate = useNavigate();
    const clubs = useSelector((state: RootState) => state.clubs.value);
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
        clubField.hint = 'Falls Sie Ihren Verein nicht finden, bitten Sie den Sportwart Ihres Vereins, Ihren Verein auf abzumplatz.de zu registrieren.';
        clubField.options = [
            {
                label: 'Verein auswählen',
                value: ''
            },
            ...clubs.map(club => ({
                label: club.name,
                value: club._id
            }))
        ];
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
