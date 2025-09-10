import { isToday } from '../../utils/utils';
import { AuthenticatedUser } from '../../types.js';

type Props = {
    reservationDate: Date;
    setReservationDate: Function;
    fetchAppData: Function;
    user: AuthenticatedUser
}

export function Calendar(props: Props) {
    const { reservationDate, setReservationDate, fetchAppData, user } = props;
    const isoDate = reservationDate.toISOString().split('T')[0];

    const nextDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() + 1);
        setReservationDate(new Date(next));
    };
    const prevDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() - 1);
        setReservationDate(new Date(next));
    };
    const today = () => {
        setReservationDate(new Date());
    };

    const reload = () => {
        fetchAppData(user.club_id);
    };

    const disabled = isToday(reservationDate);

    return (
        <div className="header">
            <span onClick={reload} className="icon icon--inline icon--reload"></span>
            <button
                onClick={prevDay}
                className="prev">&lt;</button>
            <span className="date-picker">
                <span className="shortday">{new Date(isoDate).toLocaleDateString('de-DE', {weekday: 'short'}).toUpperCase()}</span>
                <input type="date"
                value={isoDate}
                onChange={e => setReservationDate(new Date(e.target.value))} />
            </span>
            <button
                onClick={nextDay}
                className="next">&gt;</button>
            <button
                disabled={disabled}
                onClick={today}
                className="today">Heute</button>
        </div>
    )
}
