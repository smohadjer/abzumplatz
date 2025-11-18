import { SignupClub } from '../components/signupClub/SignupClub';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'
import { Club } from '../types';

type Response = {
    message: string;
    data: {
        club_id: string;
        clubs: Club[];
    }
}

export default function RegisterClub() {
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
        <>
            <h2>Verein Registrieren</h2>
            <p>Als Administrator sollten Sie Ihren Verein registrieren, bevor Sie und die Spieler Reservierungen vornehmen können.</p>
            <SignupClub label="Verein Registrieren" callback={callback} />
        </>
    )
}
