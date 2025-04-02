import './courts.css';
import { useState, useEffect } from "react";
import { Rows } from './Rows';
import { Header } from './Header';
import { ReservationItem, NormalizedReservationItem, User } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from './../../store';

type Props = {
    users: User[];
    courts_count: number;
    club_id: string;
}

const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function Courts(props: Props) {
    const [disabled, setDisabled] = useState(false);
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const user_id = useSelector((state: RootState) => state.auth._id);
    const { club_id } = props;
    const [reservationDate, setReservationDate] = useState(new Date());
    const isoDate = reservationDate.toISOString().split('T')[0];
    const filteredReservations: NormalizedReservationItem[] = reservations.filter(item => item.date === isoDate);
    const getUserName = (userId: string) => {
        if (props.users.length > 0) {
            const user = props.users.find((item: User) => item._id === userId);
            return user ? user.first_name.charAt(0) + '. ' + user.last_name : userId;
        } else {
            return userId;
        }
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

    function deleteReservation(slot: HTMLElement) {
        if (disabled) {
            return;
        }

        const reservationId = slot.dataset.reservation_id;
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
                deleteReservation(slot);
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

    const nextDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() + 1);
        setReservationDate(new Date(next));
    }

    const prevDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() - 1);
        setReservationDate(new Date(next));
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
                    {hours.map(hour => <div className="hour" key={hour}>{hour < 10 ? '0' + hour : hour}:00</div>)}
                </div>
                <div className="slots">
                    <Header count={props.courts_count} />
                    {hours.map(hour =>
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
            {reservations.length
                ? <MyReservations reservations={reservations} />
                : <p>Keine Reservierung gefunden!</p>
            }
        </div>
    )
}

function MyReservations(props: {
    reservations:  NormalizedReservationItem[]
}) {
    const myReservations = props.reservations.filter(item => item.date >= new Date().toISOString().split('T')[0]);

    return (
        <ul className="my-reservations">
        {myReservations.map(item => {
            const day = new Date(item.date);
            return (
                <li key={item._id}>
                    Platz {item.court_num} am {day.toLocaleDateString('de-DE', {weekday: 'short'})}. {day.toLocaleDateString('de-DE')} um {item.start_time}:00 Uhr
                </li>
            )}
        )}
    </ul>
    );
}
