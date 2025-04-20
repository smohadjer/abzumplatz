import { useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from './../../store';
import { isInPast, getClub } from '../../utils/utils';
import { ReservationItem, NormalizedReservationItem, User } from '../../types';
import { Rows } from './Rows';
import { Header } from './Header';
import { Popup } from './Popup';
import { MyReservations } from '../myReservations/MyReservations';
import { Calendar } from './Calendar';
import './courts.css';

type Props = {
    users: User[];
    reservations: ReservationItem[]
}

export function Courts(props: Props) {
    const [disabled, setDisabled] = useState(false);
    const [popupContent, setPopupContent] = useState<HTMLElement | null>(null);
    const [popupType, setPopupType] = useState('');
    const [reservations, setReservations] = useState<ReservationItem[]>(props.reservations);
    const auth = useSelector((state: RootState) => state.auth);
    const user_id = auth._id;
    const club = getClub();

    if (club === undefined) {
        return null;
    }

    const clubHours = Array.from({
        length: club.end_hour - club.start_hour
    }, (_, i) => i + club.start_hour);
    const [reservationDate, setReservationDate] = useState(new Date());
    const isoDate = reservationDate.toISOString().split('T')[0];
    const reservationFilter = (item: ReservationItem) => {
        const reservationWeekday = new Date(item.date).toLocaleDateString('de-DE', {weekday: 'short'});
        const today = new Date(isoDate).toLocaleDateString('de-DE', {weekday: 'short'});
        return item.date === isoDate || (item.recurring && reservationWeekday === today )
    };
    const filteredReservations: ReservationItem[] = reservations.filter(reservationFilter);
    const normalizedReservations: NormalizedReservationItem[] = filteredReservations.map(item => ({...item, user_name: getUserName(item.user_id)}));

    const myReservations = reservations.filter(item => item.user_id === user_id && item.date >= new Date().toISOString().split('T')[0]);

    function getUserName(userId: string) {
        if (props.users.length > 0) {
            const user = props.users.find((item: User) => item._id === userId);
            return user ? user.first_name.charAt(0) + '. ' + user.last_name : userId;
        } else {
            console.warn('no user found', props.users)
            return userId;
        }
    }

    function closePopup() {
        setPopupContent(null);
    }

    function showPopup(slot: HTMLElement, type: string) {
        if (type === 'deleteReservation') {
            setPopupType('delete');
            setPopupContent(slot);
        }

        if (type === 'makeReservation') {
            setPopupType('make')
            setPopupContent(slot);
        }
    }

    function makeReservation() {
        if (disabled || !popupContent) {
            return;
        }

        const start = Number(popupContent.dataset.hour);
        const end = start + 1;
        const data = {
            club_id: auth.club_id,
            user_id,
            court_num: popupContent.dataset.court_number,
            start_time: start,
            end_time: end,
            date: isoDate
        };

        setDisabled(true);

        fetch('/api/reservations', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then(json => {
            if (json.error) {
                alert(json.error);
            } else {
                if (json.data) {
                    setReservations(json.data)
                }
            }
        })
        .finally(() => {
            setDisabled(false);
            closePopup();
        })
    }

    function deleteReservation() {
        if (disabled || !popupContent) {
            return;
        }

        const reservationId = popupContent.dataset.reservation_id;
        setDisabled(true);

        fetch(`/api/reservations?reservation_id=${reservationId}&club_id=${auth.club_id}`, {
            method: 'DELETE'
        })
        .then((response) => response.json())
        .then(json => {
            if (json.error) {
                console.error(json.error)
            } else {
                if (json.data) {
                    setReservations(json.data);
                }
            }
        })
        .finally(() => {
            setDisabled(false);
            closePopup();
        });

    }

    function clickHandler (event: React.MouseEvent) {
        if (disabled) {
            return;
        }

        if (event.target instanceof HTMLElement) {
            const slot = event.target;

            // slots in the past or reserved by others should not be clickable
            if (slot.classList.contains('past') ||
              (slot.classList.contains('reserved') && !slot.classList.contains('my-reservation'))
            ) {
                return;
            }

            if (slot.classList.contains('my-reservation')) {
                showPopup(slot, 'deleteReservation');
                return;
            }

            // if user has reached max allowed reservations alert and return
            const limit = club?.reservations_limit ?? 0;
            if (myReservations.length >= limit) {
                alert(`Sie haben die maximal zulässige Anzahl an Reservierungen (${limit}) erreicht!`);
                return;
            }

            // if user is trying to make a reservation in the past alert and return
            if (isInPast(reservationDate, Number(slot.dataset.hour))) {
                alert('Eine Reservierung in der Vergangenheit ist nicht möglich!');
                return;
            }

            showPopup(slot, 'makeReservation')
        }
    }

    return (
        <div className="reservations">
            <Calendar reservationDate={reservationDate} setReservationDate={setReservationDate} />
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
                            user_id={user_id}
                            isPast={isInPast(reservationDate, hour)}
                        />
                    )}
                </div>
            </div>
            <MyReservations
                showPopup={showPopup}
                reservations={myReservations} />
            { popupContent ? <Popup
                type={popupType}
                disabled={disabled}
                closePopup={closePopup}
                clickHandler={popupType === 'delete' ? deleteReservation : makeReservation}
                content={popupContent} />
                : null
            }
        </div>
    )
}
