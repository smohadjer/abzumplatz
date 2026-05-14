import { useDispatch } from 'react-redux'
import { isToday, fetchAppData } from '../../utils/utils';
import { AuthenticatedUser } from '../../types.js';

type Props = {
    reservationDate: Date;
    setReservationDate: Function;
    user: AuthenticatedUser;
    setLoading: Function;
}

export function Calendar(props: Props) {
    const dispatch = useDispatch();
    const { reservationDate, setReservationDate, user } = props;
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

    const reload = async () => {
        props.setLoading(true);
        await fetchAppData(user.club_id, dispatch);
        props.setLoading(false);
    };

    const disabled = isToday(reservationDate);

    return (
        <div className="header">
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
                    <span className="shortday">{new Date(isoDate).toLocaleDateString('de-DE', {weekday: 'short'}).toUpperCase()}</span>
                    <input type="date"
                    value={isoDate}
                    onChange={e => {
                        const selectedDate = e.currentTarget.value;
                        setReservationDate(selectedDate ? new Date(selectedDate) : new Date());
                    }} />
                </span>
                <button
                    onClick={nextDay}
                    className="next">&gt;</button>
            </div>
        </div>
    )
}
