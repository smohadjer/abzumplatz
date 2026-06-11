import { ReservationItem } from '../../types';
import { getClub } from './../../utils/utils';
import './myReservations.css';

export function MyReservations(props: {
    reservations:  ReservationItem[];
    hasPopup: boolean;
    showPopup: Function;
}) {
    const { reservations } = props;
    const club = getClub();
    const reservationsLimit = club?.reservations_limit;

    return (
        <div className="my-reservations">
            <h1>Meine Reservierungen {club &&
                reservationsLimit != null &&
                <span>({reservations.length} von {String(reservationsLimit)})</span>}
            </h1>
            {reservations.length ?
                <ul>
                {reservations.map(item => {
                    const day = new Date(item.date);
                    const isoDate = day.toLocaleDateString('de-DE');
                    const weekday = day.toLocaleDateString('de-DE', {weekday: 'short'});
                    const key = item._id!.toString();
                    const courtNums = item.court_nums;
                    const courtNumsLabel = courtNums.join(', ');
                    const primaryCourtNum = courtNums[0];

	                    return (
	                        <li key={key}>
	                            {item.label ? `${item.label}, ` : ''}
	                            {weekday} {isoDate}, {''}
	                            {item.start_time}-{item.end_time} Uhr,{' '}
	                            {courtNums.length > 1 ? 'Plätze' : 'Platz'} {courtNumsLabel}
                            {item.recurring ? ' (wiederkehrend)' : ''}
                            {props.hasPopup && <span
                                onClick={event => {props.showPopup(event.target)}}
                                data-court_number={primaryCourtNum}
                                data-court_nums={JSON.stringify(courtNums)}
                                data-club_id={item.club_id}
                                data-hour={item.start_time}
                                data-end_time={item.end_time}
                                data-date={item.date}
                                data-reservation_id={item._id}
                                data-user_id={item.user_id}
                                data-label={item.label}
                                data-deleted_dates={item.deleted_dates ? JSON.stringify(item.deleted_dates) : undefined}
                                data-end_date={item.end_date}
                                data-timestamp={item.timestamp ? item.timestamp.toString() : undefined}
                                className="icon icon--inline icon--edit"></span>}
                        </li>
                    )}
                )}
                </ul>
                : (
                    <p>Sie haben keine aktiven Reservierungen.</p>
                )
            }
        </div>
    );
}
