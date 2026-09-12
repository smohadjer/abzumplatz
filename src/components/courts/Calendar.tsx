import { useDispatch } from 'react-redux'
import { fetchAppData } from '../../utils/utils';
import { getIsoDateString, getIsoWeekday, getZonedDateTime } from '../../utils/reservationTime';
import { AuthenticatedUser } from '../../types.js';

import './calendar.css';

type Props = {
    reservationDate: Date;
    setReservationDate: Function;
    user: AuthenticatedUser;
    setLoading: Function;
    timeZone: string;
}

export function Calendar(props: Props) {
    const dispatch = useDispatch();
    const { reservationDate, setReservationDate, user } = props;
    const isoDate = getIsoDateString(reservationDate);

    const nextDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() + 1);
        setReservationDate(new Date(next));
    };
    const prevDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() - 1);
        setReservationDate(new Date(next));
    };
    const today = () => {
        setReservationDate(new Date(`${getZonedDateTime(new Date(), props.timeZone).date}T12:00:00`));
    };

    const reload = async () => {
        props.setLoading(true);
        await fetchAppData(user.club_id, dispatch);
        props.setLoading(false);
    };

    const disabled = isoDate === getZonedDateTime(new Date(), props.timeZone).date;
    const weekday = new Intl.DateTimeFormat('de-DE', {weekday: 'short', timeZone: 'UTC'})
        .format(new Date(Date.UTC(2023, 0, 1 + getIsoWeekday(isoDate))));

    return (
        <div className="calendar">
            <div className="header_refresh">
                <span onClick={reload} className="icon icon--inline icon--reload">Neu laden</span>
                <button
                    disabled={disabled}
                    onClick={today}
                    className="today">Heute</button>
            </div>
            <div className="header_datepicker">
                <button
                    onClick={prevDay}
                    className="prev">&lt;</button>
                <span className="date-picker">
                    <span className="shortday">{weekday.toUpperCase()}</span>
                    <input type="date"
                    value={isoDate}
                    onChange={e => {
                        const selectedDate = e.currentTarget.value;
                        const fallbackDate = getZonedDateTime(new Date(), props.timeZone).date;
                        setReservationDate(new Date(`${selectedDate || fallbackDate}T12:00:00`));
                    }} />
                </span>
                <button
                    onClick={nextDay}
                    className="next">&gt;</button>
            </div>
        </div>
    )
}
