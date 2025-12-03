import { MouseEventHandler } from "react";
import { Court, NormalizedReservationItem } from "../../types";

type Props = {
    courts: Court[]
    hour: number;
    date: string;
    onClick: MouseEventHandler;
    reservations: NormalizedReservationItem[];
    user_id: string;
    isPast: boolean;
}

export function Rows(props: Props) {
    const row = [];
    const reservationsFiltered = props.reservations.filter(item => (item.start_time === props.hour ||
        (item.start_time < props.hour && item.end_time > props.hour)));

    for (let i = 0; i < props.courts.length; i++) {
        const courtStatus = props.courts[i].status;
        const courtNumber = i+1;
        const reservation = reservationsFiltered.find(item => item.court_num === courtNumber.toString());
        const isMyReservation = reservation?.user_id === props.user_id ? true : false;
        const getLabel = (reservation: NormalizedReservationItem) => {
            const label = reservation.label ? reservation.label : reservation.user_name;
            return label;
        }

        row.push(
            <div className={'cell' +
                (courtStatus === 'inactive' ? ' disabled' : '') +
                (reservation ? ' reserved' : '') +
                (props.isPast ? ' past' : '') +
                (isMyReservation ? ' my-reservation' : '')}
                onClick={props.onClick}
                data-court_number={courtNumber}
                data-hour={props.hour}
                data-date={props.date}
                data-recurring={
                    (reservation && reservation.recurring) ? reservation.recurring : false
                }
                key={courtNumber}
                data-reservation_id={reservation ? reservation._id : undefined}
            >{reservation ? getLabel(reservation) : ''}
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
