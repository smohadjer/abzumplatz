import { NormalizedReservationItem } from '../../types';


export function MyReservations(props: {
    reservations:  NormalizedReservationItem[];
}) {
    return (
        <ul className="my-reservations">
            {props.reservations.map(item => {
                const day = new Date(item.date);
                return (
                    <li key={item._id}>
                        {day.toLocaleDateString('de-DE', {weekday: 'short'})} {day.toLocaleDateString('de-DE')}, {item.start_time}-{item.end_time} Uhr, Platz {item.court_num}
                    </li>
                )}
            )}
        </ul>
    );
}
