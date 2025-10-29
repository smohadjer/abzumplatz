import { Form } from '../form/Form';
import formJson from './signupClubForm.json';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'
import { Club } from '../../types';

type Response = {
    message: string;
    data: {
        club_id: string;
        clubs: Club[];
    }
}

export function SignupClub() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const callback = async (response: Response) => {
        console.log(response.data);
        if (response.data) {
            dispatch({
                type: 'auth/setClubId',
                payload: {
                    club_id: response.data.club_id
                }
            });

            dispatch({
                type: 'clubs/fetch',
                payload: {
                    value: response.data.clubs
                }
            });
            navigate('/reservations');
        }
    }

    return (
        <Form
            classNames="signup"
            initialData={formJson.fields}
            formAttributes={formJson.form}
            label="Verein Registrieren"
            pathSchema="/schema/club.json"
            callback={callback}
        />
    )
}
