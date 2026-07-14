import { Form } from '../form/Form';
import formJson from './selectClubForm.json';
import { Field, Club } from '../../types';
import { useDispatch } from 'react-redux'
import { useNavigate } from "react-router";
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useState } from 'react';
import { Loader } from '../loader/Loader';

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
    const [pending, setPending] = useState(false);
    const clubs = props.clubs
        .filter(club => club._id !== auth.club_id)
        .map(club => {
        return {
            label: club.name,
            value: club._id,
        }
    });

    const updateMembershipState = (response: Response) => {
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
                loaded: false,
                clubId: ''
            }
        });
        dispatch({
            type: 'reservations/fetch',
            payload: {
                value: [],
                loaded: false
            }
        });
    };

    // we update logged-in user in state so that user's club_id is available
    const callback = (response: Response) => {
        updateMembershipState(response);
        navigate(response.data.club_id ? '/profile' : '/select-club');
    }

    const leaveClub = async () => {
        setPending(true);
        try {
            const response = await fetch('/api/select-club', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({action: 'leave'})
            });

            const json = await response.json();
            if (!response.ok || json.error) {
                throw new Error(json.error?.[0]?.message ?? json.error ?? 'Verein konnte nicht verlassen werden.');
            }

            updateMembershipState(json);
            navigate('/select-club');
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Verein konnte nicht verlassen werden.');
        } finally {
            setPending(false);
        }
    };

    // normalize json by adding clubs data to clubs dropdown
    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.map(field => {
        if (field.name === 'club_id' && field.options) {
            if (auth.club_id) {
                field.label = 'Neuer Verein';
            }
            field.options = [
                {
                    label: auth.club_id ? 'Verein auswählen' : 'Keinen Verein auswählen',
                    value: ''
                },
                ...clubs
            ];
        }
        return field;
    });

    return (
        <>
            <Form
                classNames="select-club"
                initialData={normalizedFields}
                formAttributes={formJson.form}
                label={auth.club_id ? 'Verein wechseln' : 'Absenden'}
                callback={callback}
            />
            {auth.club_id ? (
                <p>
                    <button type="button" disabled={pending} onClick={leaveClub}>
                        {pending ? <Loader size="small" /> : null}
                        Kein Verein
                    </button>
                </p>
            ) : null}
        </>
    )
}
