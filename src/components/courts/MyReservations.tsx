import { NormalizedReservationItem } from '../../types';

export function MyReservations(props: {
    reservations:  NormalizedReservationItem[];
    user_id: string;
}) {
    const myReservations = props.reservations.filter(item => item.user_id === props.user_id && item.date >= new Date().toISOString().split('T')[0]);

    return (
        <ul className="my-reservations">
        {myReservations.map(item => {
            const day = new Date(item.date);
            return (
                <li key={item._id}>
                    {day.toLocaleDateString('de-DE', {weekday: 'long'})} {day.toLocaleDateString('de-DE')}, {item.start_time}-{item.end_time} Uhr, Platz {item.court_num}
                </li>
            )}
        )}
    </ul>
    );
}
