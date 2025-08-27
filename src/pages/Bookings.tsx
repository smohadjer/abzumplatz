import { useState, useEffect } from "react";
import { getUserReservations } from './../utils/utils';
import { MyReservations } from './../components/myReservations/MyReservations';
import { Popup } from '../components/courts/Popup';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Loader } from '../components/loader/Loader';

type Slot = {
    date: string;
    hour: number;
    court_number: string;
    reservation_id?: string;
    recurring?: boolean;
}

type Props = {
    fetchAppData: Function;
}

export default function Bookings(props: Props) {
    const { fetchAppData } = props;
    const [loading, setLoading] = useState(false);
    const reservationsData = useSelector((state: RootState) => state.reservations);
    const [slot, setSlot] = useState<Slot | null>(null);
    const [disabled, setDisabled] = useState(false);
    const closePopup = () => {
        setDisabled(false);
        setSlot(null);
    };

    const user = useSelector((state: RootState) => state.auth);
    const userReservations = getUserReservations();

    // get users and reservations
    useEffect(() => {
        if (!reservationsData.loaded) {
            (async () => {
                setLoading(true);
                await fetchAppData(user.club_id);
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
            <>
                <MyReservations
                    hasPopup={true}
                    showPopup={(slot: HTMLElement) => {
                        setSlot({
                            court_number: slot.dataset.court_number!,
                            date: slot.dataset.date!,
                            hour: Number(slot.dataset.hour),
                            reservation_id: slot.dataset.reservation_id,
                            recurring: slot.dataset.recurring === 'true'
                        });
                    }}
                    reservations={userReservations}
                />
                {slot && <Popup
                    type='deleteReservation'
                    slot={slot}
                    disabled={disabled}
                    setDisabled={setDisabled}
                    closePopup={closePopup}>
                </Popup>}
            </>
        )
    )
}
