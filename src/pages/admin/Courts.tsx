import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './../../store';
import { fetchClub } from '../../utils/utils';
import { Loader } from '../../components/loader/Loader';
import { EditCourts } from '../../components/editCourts/EditCourts';

import { Link, useNavigate } from 'react-router';
import { Club } from '../../types';

type Response = {
    message: string;
    data: {
        club_id: string;
        clubs: Club[];
    }
}

export default function AdminCourtsPage() {
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: RootState) => state.auth);
    const clubData = useSelector((state: RootState) => state.club);
    const club_id = user.club_id;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const callback = async (response: Response) => {
        if (response.data) {
            dispatch({
                type: 'clubs/fetch',
                payload: {
                    value: response.data.clubs
                }
            });

            const updatedClub = response.data.clubs.find(item => item._id === club_id);

            dispatch({
                type: 'club/fetch',
                payload: {
                    value: updatedClub,
                    loaded: true,
                }
            });

            navigate('/admin');
        }
    }

    useEffect(() => {
        if (!clubData.loaded || clubData.value._id !== club_id) {
            (async () => {
                setLoading(true);
                await fetchClub(club_id, dispatch);
                setLoading(false);
            })();
        }
    }, [club_id, clubData.loaded, clubData.value._id, dispatch]);

    return (
        loading || !clubData.loaded ? (
            <div className="splash">
                <Loader size="big" text="Loading data..." />
            </div>
        ) : (
            <>
                <Link className="icon icon--back" to="/admin">Zurück</Link>
                <h2>Plätze Verwalten</h2>
                <EditCourts
                    callback={callback}
                    data={clubData.value} />
            </>
        )
    )
}
