import { Form } from '../form/Form';
import formJson from './selectClubForm.json';
import { Field, Club } from '../../types';
import { useDispatch } from 'react-redux'
import { JwtPayload } from '../../types.js';
import { useNavigate } from "react-router";

type Props = {
    clubs: Club[];
}

export function SelectClub(props: Props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const clubs = props.clubs.map(club => {
        return {
            label: club.name,
            value: club._id,
        }
    });
    const callback = (response: JwtPayload) => {
        dispatch({type: 'auth/login', payload: {
            value: true,
            ...response
        }});
        navigate('/reservations');
    }

    // normalize json by adding clubs data to clubs dropdown
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.map(field => {
        if (field.name === 'club_id' && field.options) {
            field.options.push(...clubs);
        }
        return field;
    });

    return (
        <Form
            classNames="select-club"
            initialData={normalizedFields}
            formAttributes={formJson.form}
            label="Absenden"
            callback={callback}
        />
    )
}
