import './courts.css';
import { useState } from "react";
import { Rows } from './Rows';
import { Header } from './Header';
import { ReservationItem, NormalizedReservationItem, User } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from './../../store';

type Props = {
    reservations: ReservationItem[];
    users: User[];
    courts_count: number;
    club_id: string;
    setReservations: Function;
}

const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function Courts(props: Props) {
    const [disabled, setDisabled] = useState(false);
    const user_id = useSelector((state: RootState) => state.auth._id);
    const { club_id } = props;
    const date = new Date().toISOString().split('T')[0];
    const filteredReservations: NormalizedReservationItem[] = props.reservations.filter(item => item.date === date);
    const getUserName = (userId: string) => {
        if (props.users.length > 0) {
            const user = props.users.find((item: User) => item._id === userId);
            return user ? user.first_name.charAt(0) + '. ' + user.last_name : userId;
        } else {
            return userId;
        }
    };

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
                    props.setReservations(json.data);
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
                date: date
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
                        props.setReservations(json.data)
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
        <div className="header">{date}</div>
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
        </div>
    )
}
