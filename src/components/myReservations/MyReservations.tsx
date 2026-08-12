import { ReservationItem } from '../../types';
import {
    getClub,
    getNextActiveRecurringReservationDate
} from './../../utils/utils';

export function MyReservations(props: {
    reservations:  ReservationItem[];
}) {
    const { reservations } = props;
    const club = getClub();
    const reservationsLimit = club?.reservations_limit;
    const sortedReservations = [...reservations].sort((first, second) => {
        const firstDate = first.recurring ? getNextActiveRecurringReservationDate(first) : first.date;
        const secondDate = second.recurring ? getNextActiveRecurringReservationDate(second) : second.date;
        const dateDifference = new Date(secondDate ?? second.date).getTime() - new Date(firstDate ?? first.date).getTime();

        return dateDifference || second.start_time - first.start_time;
    });

    return (
        <div className="my-reservations">
            <h1>Meine Reservierungen {club &&
                reservationsLimit != null &&
                <span>({reservations.length} von {String(reservationsLimit)})</span>}
            </h1>
            {reservations.length ?
                <ul>
                {sortedReservations.map(item => {
                    const activeDate = item.recurring ? getNextActiveRecurringReservationDate(item) : item.date;
                    const day = new Date(activeDate ?? item.date);
                    const isoDate = day.toLocaleDateString('de-DE');
                    const weekday = day.toLocaleDateString('de-DE', {weekday: 'short'});
                    const key = item._id!.toString();
                    const courtNums = item.court_nums;
                    const courtNumsLabel = courtNums.join(', ');

	                    return (
	                        <li key={key}>
	                            {item.label ? `${item.label}, ` : ''}
	                            {weekday} {isoDate}, {''}
                            {item.start_time}-{item.end_time} Uhr,{' '}
	                            {courtNums.length > 1 ? 'Plätze' : 'Platz'} {courtNumsLabel}
                            {item.recurring ? ' (wiederkehrend)' : ''}
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
