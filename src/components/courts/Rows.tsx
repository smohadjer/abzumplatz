import { MouseEventHandler } from "react";
import { NormalizedReservationItem } from "../../types";

type Props = {
    count: number;
    hour: number;
    onClick: MouseEventHandler;
    reservations: NormalizedReservationItem[];
    user_id: string;
    isPast: boolean;
}

export function Rows(props: Props) {
    const row = [];
    for (let courtNumber = 1; courtNumber < props.count+1; courtNumber++) {
        const reservation = props.reservations.find(item => item.start_time == props.hour && item.court_num == courtNumber);
        const isMyReservation = reservation?.user_id === props.user_id ? true : false;

        row.push(
            <div className={'cell' +
                (reservation ? ' reserved' : '') +
                (props.isPast ? ' past' : '') +
                (isMyReservation ? ' my-reservation' : '')}
                onClick={props.onClick}
                data-court_number={courtNumber}
                data-hour={props.hour}
                key={courtNumber}
                data-reservation_id={(reservation && isMyReservation) ? reservation._id : undefined}
                data-reservation_date={(reservation && isMyReservation) ? reservation.date : undefined}>
                {reservation ? reservation.user_name : ''}
            </div>
        );
    }

    return (
        <div className="courts__row">
            <div className="courts__rowSlots">
                {row}
            </div>
        </div>
    );
}
