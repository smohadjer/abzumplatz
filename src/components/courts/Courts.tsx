import './courts.css';
import { useState, useEffect } from "react";
import { Rows } from './Rows';
import { Header } from './Header';
import { ReservationItem, NormalizedReservationItem, User, Club } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from './../../store';
import { Popup } from './Popup';
import { MyReservations } from './MyReservations';

type Props = {
    users: User[];
    courts_count: number;
    club: Club;
}

export function Courts(props: Props) {
    const [disabled, setDisabled] = useState(false);
    const [popupContent, setPopupContent] = useState<HTMLElement | null>(null);
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const user_id = useSelector((state: RootState) => state.auth._id);
    const club_id = props.club._id;
    const clubHours = Array.from({
        length: props.club.end_hour - props.club.start_hour
    }, (_, i) => i + props.club.start_hour);
    const [reservationDate, setReservationDate] = useState(new Date());
    const isoDate = reservationDate.toISOString().split('T')[0];
    const filteredReservations: NormalizedReservationItem[] = reservations.filter(item => item.date === isoDate);
    const nextDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() + 1);
        setReservationDate(new Date(next));
    };
    const prevDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() - 1);
        setReservationDate(new Date(next));
    };

    // get all reservations
    useEffect(() => {
        fetch(`/api/reservations?club_id=${club_id}`)
        .then(res => res.json())
        .then(json => {
            setReservations(json);
        });
    }, []);

    filteredReservations.map(item => item.user_name = getUserName(item.user_id));

    const myReservations = reservations.filter(item => item.user_id === user_id && item.date >= new Date().toISOString().split('T')[0]);

    function getUserName(userId: string) {
        if (props.users.length > 0) {
            const user = props.users.find((item: User) => item._id === userId);
            return user ? user.first_name.charAt(0) + '. ' + user.last_name : userId;
        } else {
            console.warn('no users found', props.users)
            return userId;
        }
    }

    function closePopup() {
        setPopupContent(null);
    }

    function showPopup(slot: HTMLElement) {
        console.log('show popup')
        setPopupContent(slot);
    }

    function deleteReservation() {
        if (disabled || !popupContent) {
            return;
        }

        const reservationId = popupContent.dataset.reservation_id;
        setDisabled(true);

        fetch(`/api/reservations?reservation_id=${reservationId}&club_id=${club_id}`, {
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

            if (slot.classList.contains('reserved')) {
                return;
            }

            if (slot.classList.contains('delete')) {
                showPopup(slot);
                return;
            }

            // if user has reached max allowed reservations alert and return
            const limit = props.club.reservations_limit;
            if (myReservations.length >= limit) {
                alert(`You have reached maximum allowed reservations (${limit})!`);
                return;
            }

            // if user is trying to make a reservation in the past alert and return
            const reservationTime = new Date(reservationDate);
            reservationTime.setHours(Number(slot.dataset.hour));
            reservationTime.setMinutes(0);
            reservationTime.setSeconds(0);
            if (reservationTime < new Date()) {
                alert('You can\'t make a reservation in the past!');
                return;
            }

            slot.classList.add('loading');

            const start = Number(slot.dataset.hour);
            const end = start + 1;
            const data = {
                club_id,
                user_id,
                court_num: slot.dataset.court_number,
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
                slot.classList.remove('loading');
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
            })
        }
    }

    return (
        <div className="reservations">
            <div className="header">
                <button
                    onClick={prevDay}
                    className="prev">&lt;</button>
                <input className="date-picker" type="date"
                    value={isoDate}
                    onChange={e => setReservationDate(new Date(e.target.value))}
                />
                <button
                    onClick={nextDay}
                    className="next">&gt;</button>
            </div>
            <div className="main">
                <div className="hours">
                    {clubHours.map(hour => <div className="hour" key={hour}>{hour < 10 ? '0' + hour : hour}:00</div>)}
                </div>
                <div className="slots">
                    <Header count={props.courts_count} />
                    {clubHours.map(hour =>
                        <Rows
                            reservations={filteredReservations}
                            onClick={clickHandler}
                            key={hour}
                            hour={hour}
                            count={props.courts_count}
                            user_id={user_id}
                        />
                    )}
                </div>
            </div>
            <h2>Meine Reservierungen</h2>
            { reservations.length
                ? <MyReservations reservations={reservations} user_id={user_id} />
                : <p>Keine Reservierung gefunden!</p>
            }
            { popupContent ? <Popup
                disabled={disabled}
                closePopup={closePopup}
                deleteReservation={deleteReservation}
                content={popupContent} />
                : null
            }
        </div>
    )
}
