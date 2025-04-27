import { FormEvent, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from './../../store';
import { isInPast, getClub, recurringReservationIsOnSameDay, getLocalDate } from '../../utils/utils';
import { ReservationItem, NormalizedReservationItem, User } from '../../types';
import { Rows } from './Rows';
import { Header } from './Header';
import { Popup } from './Popup';
import { MyReservations } from '../myReservations/MyReservations';
import { Calendar } from './Calendar';
import { Loader } from './../loader/Loader';
import './courts.css';

type Props = {
    users: User[];
    reservations: ReservationItem[]
}

type Slot = {
    date: string;
    hour: number;
    court_number: string;
    reservation_id?: string;
    recurring?: boolean;
}

export function Courts(props: Props) {
    const [disabled, setDisabled] = useState(false);
    const [popupType, setPopupType] = useState('');
    const [slot, setSlot] = useState<Slot | null>(null);
    const [reservations, setReservations] = useState<ReservationItem[]>(props.reservations);
    const user = useSelector((state: RootState) => state.auth);
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
        return item.date === isoDate || recurringReservationIsOnSameDay({date: item.date, recurring: item.recurring ?? false }, isoDate);
    };
    const getUserName = (userId: string) => {
        if (props.users.length > 0) {
            const user = props.users.find((item: User) => item._id === userId);
            return user ? user.first_name.charAt(0) + '. ' + user.last_name : userId;
        } else {
            console.warn('no user found', props.users)
            return userId;
        }
    };
    const filteredReservations: ReservationItem[] = reservations.filter(reservationFilter);
    const normalizedReservations: NormalizedReservationItem[] = filteredReservations.map(item => ({...item, user_name: getUserName(item.user_id)}));
    const userReservations = reservations.filter(item => item.user_id === user._id);
    const validUserReservations = userReservations.filter(item => (item.recurring ||
        (!item.recurring && item.date >= new Date().toISOString().split('T')[0]))
    )
    const closePopup = () => {
        setSlot(null);
    };
    const makeReservation = (event: FormEvent) => {
        if (disabled || slot === null) {
            return;
        }

        event.preventDefault();

        if (event.target instanceof HTMLFormElement) {
            const form: HTMLFormElement = event.target!;
            const formData = new FormData(form);
            const duration = Number(formData.get('duration') ?? 1);
            const label = formData.get('label');
            const recurring = formData.get('recurring') ?? false;
            setDisabled(true);

            const data = {
                club_id: user.club_id,
                user_id: user._id,
                court_num: slot.court_number,
                start_time: slot.hour,
                end_time:  slot.hour + duration,
                date: slot.date,
                label,
                recurring
            };

            fetch(form.action, {
                method: form.method,
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then((response) => response.json())
            .then(json => {
                if (json.error) {
                    console.error(json.error);
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
            });
        }
    };
    const deleteReservation = (event: FormEvent) => {
        if (disabled || slot === null) {
            return;
        }

        event.preventDefault();

        if (event.target instanceof HTMLFormElement) {
            const form: HTMLFormElement = event.target!;
            setDisabled(true);
            fetch(form.action, {
                method: 'DELETE'
            })
            .then((response) => response.json())
            .then(json => {
                if (json.error) {
                    console.error(json.error);
                    alert(json.error);
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
    };

    const clickHandler = (event: React.MouseEvent) => {
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
                setPopupType('deleteReservation');
                setSlot({
                    court_number: slot.dataset.court_number!,
                    date: slot.dataset.date!,
                    hour: Number(slot.dataset.hour),
                    reservation_id: slot.dataset.reservation_id,
                    recurring: slot.dataset.recurring === 'true'
                })
                return;
            }

            // if user is not admin and has reached max allowed reservations alert and return
            const limit = club?.reservations_limit ?? 0;
            if (user.role !== 'admin' && user.role !== 'trainer' && validUserReservations.length >= limit) {
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

    const getPopupContent = (slot: Slot, popupType: string) => {
        if (popupType === 'deleteReservation') {
            return (
                <>
                    <p>Möchten Sie Ihre Reservierung am {getLocalDate(slot.date)} um {slot.hour} Uhr stornien?</p>
                    {slot.recurring && <p>Diese Reservierung wird jede Woche zur gleichen Zeit wiederholt.</p>}
                    <form
                        method="POST"
                        action={`/api/reservations?reservation_id=${slot.reservation_id}&club_id=${user.club_id}`}
                        onSubmit={deleteReservation}>
                        <button type="submit" disabled={disabled}>Reservierung löschen</button>
                        {disabled ? <Loader /> : null}
                    </form>
                </>
            );
        } else {
            return (
                <>
                    <p>Möchten Sie den Platz {slot.court_number} am {getLocalDate(slot.date)} um {slot.hour}:00 Uhr reservieren?</p>
                    <form
                        method="POST"
                        action="/api/reservations"
                        onSubmit={makeReservation}>
                        {(user.role === 'admin' || user.role === 'trainer') && <fieldset>
                            <div>
                                {/* <input defaultChecked type="radio" id="one-hour" name="duration" value="1" />
                                <label htmlFor="one-hour">Für 1 Stunde</label>
                                <input type="radio" id="two-hours" name="duration" value="2" />
                                <label htmlFor="two-hours">Für 2 Stunde</label> */}
                                <label>Dauer (Stunden):</label>
                                <select name="duration">
                                    <option defaultChecked value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                    <option value="7">7</option>
                                    <option value="8">8</option>
                                    <option value="9">9</option>
                                    <option value="10">10</option>
                                </select>
                            </div>
                            <div>
                                <label>Reservierungslabel:</label>
                                <input name="label" />
                            </div>
                            <div>
                                <input type="checkbox" id="recurring" name="recurring" value="true" />
                                <label htmlFor="recurring">Wird jede Woche zur gleichen Zeit wiederholt</label>
                            </div>
                        </fieldset>}
                        <button type="submit" disabled={disabled}>Reservieren</button>
                        {disabled ? <Loader /> : null}
                    </form>
                </>
            );
        }
    };

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
                            user_id={user._id}
                            isPast={isInPast(reservationDate, hour)}
                        />
                    )}
                </div>
            </div>
            <MyReservations
                showPopup={(slot: HTMLElement) => {
                    setPopupType('deleteReservation');
                    setSlot({
                        court_number: slot.dataset.court_number!,
                        date: slot.dataset.date!,
                        hour: Number(slot.dataset.hour),
                        reservation_id: slot.dataset.reservation_id,
                        recurring: slot.dataset.recurring === 'true'
                    });
                }}
                reservations={validUserReservations}
            />
            {slot && <Popup
                disabled={disabled}
                closePopup={closePopup}>
                {getPopupContent(slot, popupType)}
            </Popup>}
        </div>
    )
}
