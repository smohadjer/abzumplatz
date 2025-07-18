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

    return (
        <div className="my-reservations">
            <h2>Meine Reservierungen {club &&
                <span>({reservations.length} von {club.reservations_limit.toString()})</span>}
            </h2>
            {reservations.length ?
                <ul>
                {reservations.map(item => {
                    const day = new Date(item.date);
                    const isoDate = day.toLocaleDateString('de-DE');
                    const weekday = day.toLocaleDateString('de-DE', {weekday: 'short'});
                    const key = item._id!.toString();

                    return (
                        <li key={key}>
                            {weekday} {isoDate}, {''}
                            {item.start_time}-{item.end_time} Uhr,
                            Platz {item.court_num}
                            {item.recurring ? ' (wiederkehrend)' : ''}
                            {props.hasPopup && <span
                                onClick={event => {props.showPopup(event.target)}}
                                data-court_number={item.court_num}
                                data-hour={item.start_time}
                                data-date={item.date}
                                data-reservation_id={item._id}
                                className="icon icon--inline icon--delete"></span>}
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
