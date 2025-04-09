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

        const setContent = (reservation: NormalizedReservationItem) => {
            const isMyRservation = reservation?.user_id === props.user_id ? true : false;

            return (
                isMyRservation ?
                    <span className="delete"
                        data-reservation_id={reservation._id}
                        data-reservation_date={reservation.date}
                    >{reservation.user_name}</span> : reservation.user_name
            )
        }

        row.push(
            <div className={'cell' + (reservation ? ' reserved' : '') + (props.isPast ? ' past' : '')}
                onClick={props.onClick}
                data-court_number={courtNumber}
                data-hour={props.hour}
                key={courtNumber}>
                {reservation ? setContent(reservation) : ''}
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
