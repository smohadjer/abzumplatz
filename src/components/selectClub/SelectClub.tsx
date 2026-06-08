import { Form } from '../form/Form';
import formJson from './selectClubForm.json';
import { Field, Club } from '../../types';
import { useDispatch } from 'react-redux'
import { useNavigate } from "react-router";
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type Props = {
    clubs: Club[];
}

type Response = {
    message: string;
    data: {
        club_id: string;
        status: string;
    }
}

export function SelectClub(props: Props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const clubs = props.clubs
        .filter(club => club._id !== auth.club_id)
        .map(club => {
        return {
            label: club.name,
            value: club._id,
        }
    });

    // we update logged-in user in state so that user's club_id is available
    const callback = (response: Response) => {
        dispatch({
            type: 'auth/setClubId',
            payload: {
                club_id: response.data.club_id,
                status: response.data.status
            }
        });
        dispatch({
            type: 'users/fetch',
            payload: {
                value: [],
                loaded: false
            }
        });
        dispatch({
            type: 'reservations/fetch',
            payload: {
                value: [],
                loaded: false
            }
        });
        navigate('/reservations');
    }

    // normalize json by adding clubs data to clubs dropdown
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.map(field => {
        if (field.name === 'club_id' && field.options) {
            if (auth.club_id) {
                field.label = 'Neuer Verein';
            }
            field.options.push(...clubs);
        }
        return field;
    });

    return (
        <Form
            classNames="select-club"
            initialData={normalizedFields}
            formAttributes={formJson.form}
            label={auth.club_id ? 'Verein wechseln' : 'Absenden'}
            callback={callback}
        />
    )
}
