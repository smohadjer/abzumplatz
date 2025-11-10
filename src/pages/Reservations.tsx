import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store';
import {
    isInPast,
    getClub,
    recurringReservationIsOnSameDay,
    getUserReservations,
    fetchAppData,
    fetchUsers,
    fetchReservations,
} from '../utils/utils';
import { ReservationItem, NormalizedReservationItem, StateUser } from '../types';
import { Rows } from '../components/courts/Rows';
import { Header } from '../components/courts/Header';
import { Popup } from '../components/courts/Popup';
import { Calendar } from '../components/courts/Calendar';
import { Loader } from '../components/loader/Loader';

import './reservations.css';

type Slot = {
    date: string;
    hour: number;
    court_number: string;
    reservation_id?: string;
    recurring?: boolean;
}

export default function Reservations() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const usersData = useSelector((state: RootState) => state.users);
    const reservationsData = useSelector((state: RootState) => state.reservations);
    const [disabled, setDisabled] = useState(false);
    const [popupType, setPopupType] = useState('');
    const [slot, setSlot] = useState<Slot | null>(null);
    const user = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const users = usersData.value;
    const reservations = reservationsData.value;

    if (club === undefined) {
        return (
            <>
                <p>Verein nicht gefunden!</p>
            </>
        )
    }

    const clubHours = Array.from({
        length: club.end_hour - club.start_hour
    }, (_, i) => i + club.start_hour);
    const [reservationDate, setReservationDate] = useState(new Date());
    const isoDate = reservationDate.toISOString().split('T')[0];
    const reservationFilter = (reservationItem: ReservationItem) => {
        return reservationItem.date === isoDate ||
        recurringReservationIsOnSameDay(reservationItem, isoDate);
    };
    const getUserName = (userId: string) => {
        if (users.length > 0) {
            const user = users.find((item: StateUser) => item._id === userId);
            return user ? user.first_name.charAt(0) + '. ' + user.last_name : userId;
        } else {
            console.warn('no user found', users)
            return userId;
        }
    };
    const filteredReservations: ReservationItem[] = reservations.filter(reservationFilter);
    const normalizedReservations: NormalizedReservationItem[] = filteredReservations.map(item => ({...item, user_name: getUserName(item.user_id)}));
    const userReservations = getUserReservations();
    const closePopup = () => {
        setDisabled(false);
        setSlot(null);
    };
    const clickHandler = (event: React.MouseEvent) => {
        if (disabled) {
            return;
        }

        if (event.target instanceof HTMLElement) {
            const slot = event.target;
            const reservedByOthers = slot.classList.contains('reserved') && !slot.classList.contains('my-reservation');

            // slots in the past or reserved by others should not be clickable unless user is admin
            if (user.role !== 'admin' && (slot.classList.contains('past') || reservedByOthers)) {
                return;
            }

            // users can delete their own reservations
            // admin can delete any reservation
            if (slot.classList.contains('my-reservation') ||
                (reservedByOthers && user.role === 'admin')) {
                setPopupType('deleteReservation');
                setSlot({
                    court_number: slot.dataset.court_number!,
                    date: slot.dataset.date!,
                    hour: Number(slot.dataset.hour),
                    reservation_id: slot.dataset.reservation_id,
                    recurring: slot.dataset.recurring === 'true'
                });
                return;
            }

            // if user is not admin and has reached max allowed reservations alert and return
            const limit = club?.reservations_limit ?? 0;
            if (user.role !== 'admin' && userReservations.length >= limit) {
                alert(`Sie haben die maximal zulässige Anzahl an Reservierungen (${limit}) erreicht!`);
                return;
            }

            // if user is trying to make a reservation in the past alert and return
            if (isInPast(reservationDate, Number(slot.dataset.hour))) {
                alert('Eine Reservierung in der Vergangenheit ist nicht möglich!');
                return;
            }

            setPopupType('makeReservation');
            setSlot({
                court_number: slot.dataset.court_number!,
                date: slot.dataset.date!,
                hour: Number(slot.dataset.hour)
            });
        }
    };

    // get users and reservations
    useEffect(() => {
        if (!usersData.loaded && !reservationsData.loaded) {
            (async () => {
                setLoading(true);
                await fetchAppData(user.club_id, dispatch);
                setLoading(false);
            })();
        } else if (!usersData.loaded) {
            (async () => {
                setLoading(true);
                await fetchUsers(user.club_id, dispatch);
                setLoading(false);
            })();
        } else if (!reservationsData.loaded) {
            (async () => {
                setLoading(true);
                await fetchReservations(user.club_id, dispatch);
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
            <div className="grid">
                <div className="reservations">
                    <Calendar
                        reservationDate={reservationDate}
                        setReservationDate={setReservationDate}
                        user={user}
                        setLoading={setLoading}
                    />
                    <div className="main">
                        <div className="hours">
                            {clubHours.map(hour => <div className="hour" key={hour}>{hour < 10 ? '0' + hour : hour}:00</div>)}
                        </div>
                        <div className="slots">
                            <Header count={club.courts_count} />
                            {clubHours.map(hour =>
                                <Rows
                                    reservations={normalizedReservations}
                                    onClick={clickHandler}
                                    key={hour}
                                    hour={hour}
                                    date={isoDate}
                                    count={club.courts_count}
                                    user_id={user._id}
                                    isPast={isInPast(reservationDate, hour)}
                                />
                            )}
                        </div>
                    </div>
                    {slot &&
                    <Popup
                        type={popupType}
                        slot={slot}
                        disabled={disabled}
                        setDisabled={setDisabled}
                        closePopup={closePopup}>
                    </Popup>}
                </div>
            </div>
        )
    )
}
