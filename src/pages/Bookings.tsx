import { useState, useEffect } from "react";
import { getUserReservations, fetchAppData } from './../utils/utils';
import { MyReservations } from './../components/myReservations/MyReservations';
import { RootState } from '../store';
import { Loader } from '../components/loader/Loader';
import { useSelector, useDispatch } from 'react-redux'

export default function Bookings() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const reservationsData = useSelector((state: RootState) => state.reservations);

    const user = useSelector((state: RootState) => state.auth);
    const userReservations = getUserReservations();

    // get users and reservations
    useEffect(() => {
        if (!reservationsData.loaded) {
            (async () => {
                setLoading(true);
                await fetchAppData(user.club_id, dispatch);
                setLoading(false);
            })();
        }
    }, []);

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Reservierungen werden geladen" />
            </div>
        ) : (
            <MyReservations reservations={userReservations} />
        )
    )
}
