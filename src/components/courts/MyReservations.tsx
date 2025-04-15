import { NormalizedReservationItem } from '../../types';
import './myReservations.css';

export function MyReservations(props: {
    reservations:  NormalizedReservationItem[];
    showPopup: Function;
}) {
    return (
        <ul className="my-reservations">
            {props.reservations.map(item => {
                const day = new Date(item.date);
                return (
                    <li key={item._id}>
                        {day.toLocaleDateString('de-DE', {weekday: 'short'})} {day.toLocaleDateString('de-DE')}, {item.start_time}-{item.end_time} Uhr, Platz {item.court_num}
                        <span
                            onClick={event => {props.showPopup(event.target)}}
                            data-court_number={item.court_num}
                            data-hour={item.start_time}
                            data-reservation_id={item._id}
                            data-reservation_date={item.date}
                            className="icon icon--inline icon--delete"></span>
                    </li>
                )}
            )}
        </ul>
    );
}
