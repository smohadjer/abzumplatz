import { MouseEventHandler } from "react";
import { ReservationItem } from "../../types";

type Props = {
    count: number;
    hour: number;
    onClick: MouseEventHandler;
    reservations: ReservationItem[];
}

export function Rows(props: Props) {
    const courts = [];
    console.log(props.reservations, props.hour)
    for (let courtNumber = 1; courtNumber < props.count+1; courtNumber++) {
        const reservation = props.reservations.find(item => item.start_time == props.hour && item.court_num == courtNumber);
        courts.push(
            <div className={'cell ' + (reservation ? ' reserved' : '')}
                onClick={props.onClick}
                data-courtnumber={courtNumber}
                data-hour={props.hour}
                key={courtNumber}>
                {reservation ? 'reserved' : ''}
            </div>
        );
    }

    return (
        <div className="courts__row">
            <div className="courts__rowSlots">
                {courts}
            </div>
        </div>
    );
}
