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
        const reservation = reservationsFiltered.find(item => {
            const courtNums = item.court_nums?.map(courtNum => courtNum.toString()) ?? [item.court_num.toString()];
            return courtNums.includes(courtNumber.toString());
        });
        const isMyReservation = reservation?.user_id === props.user_id ? true : false;
        const isRecurringReservation = reservation?.recurring ? true : false;
        const getLabel = (reservation: NormalizedReservationItem) => {
            const label = reservation.label ? reservation.label : reservation.user_name;
            return label;
        }

        row.push(
            <div className={'cell' +
                (courtStatus === 'inactive' ? ' disabled' : '') +
                (reservation ? ' reserved' : '') +
                (props.isPast ? ' past' : '') +
                (isRecurringReservation ? ' recurring-reservation' : '') +
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
                data-club_id={reservation ? reservation.club_id : undefined}
                data-court_nums={reservation?.court_nums ? JSON.stringify(reservation.court_nums) : undefined}
                data-end_time={reservation ? reservation.end_time : undefined}
                data-user_name={reservation ? reservation.user_name : undefined}
                data-user_id={reservation ? reservation.user_id : undefined}
                data-label={reservation ? reservation.label : undefined}
                data-deleted_dates={reservation?.deleted_dates ? JSON.stringify(reservation.deleted_dates) : undefined}
                data-end_date={reservation ? reservation.end_date : undefined}
                data-timestamp={reservation?.timestamp ? reservation.timestamp.toString() : undefined}
                title={reservation ? getLabel(reservation) : undefined}
            >{reservation && isRecurringReservation ? <span className="recurring-marker" title="Wiederholt sich jede Woche">W</span> : null}
            {reservation ? getLabel(reservation) : ''}
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
