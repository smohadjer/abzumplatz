import { useState, useEffect } from "react";
import { getUserReservations, fetchAppData } from './../utils/utils';
import { MyReservations } from './../components/myReservations/MyReservations';
import { Popup } from '../components/courts/Popup';
import { RootState } from '../store';
import { Loader } from '../components/loader/Loader';
import { useSelector, useDispatch } from 'react-redux'

type Slot = {
    date: string;
    hour: number;
    court_number: string;
    court_nums?: string[];
    club_id?: string;
    reservation_id?: string;
    end_time?: number;
    recurring?: boolean;
    user_name?: string;
    user_id?: string;
    label?: string;
    deleted_dates?: string[];
    end_date?: string;
    timestamp?: string;
}

export default function Bookings() {
    const dispatch = useDispatch();
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
    const parseDatasetArray = (value: string | undefined) => value ? JSON.parse(value) : undefined;

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
            <>
                <MyReservations
                    hasPopup={true}
                    showPopup={(slot: HTMLElement) => {
                        setSlot({
                            court_number: slot.dataset.court_number!,
                            court_nums: parseDatasetArray(slot.dataset.court_nums),
                            club_id: slot.dataset.club_id,
                            date: slot.dataset.date!,
                            hour: Number(slot.dataset.hour),
                            end_time: slot.dataset.end_time ? Number(slot.dataset.end_time) : undefined,
                            reservation_id: slot.dataset.reservation_id,
                            recurring: slot.dataset.recurring === 'true',
                            user_name: `${user.first_name.charAt(0)}. ${user.last_name}`,
                            user_id: slot.dataset.user_id,
                            label: slot.dataset.label,
                            deleted_dates: parseDatasetArray(slot.dataset.deleted_dates),
                            end_date: slot.dataset.end_date,
                            timestamp: slot.dataset.timestamp
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
