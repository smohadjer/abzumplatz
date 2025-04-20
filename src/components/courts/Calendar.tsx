type Props = {
    reservationDate: Date;
    setReservationDate: Function;
}

export function Calendar(props: Props) {
    const { reservationDate, setReservationDate } = props;
    const isoDate = reservationDate.toISOString().split('T')[0];

    const nextDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() + 1);
        setReservationDate(new Date(next));
    };
    const prevDay = () => {
        const next = reservationDate.setDate(reservationDate.getDate() - 1);
        setReservationDate(new Date(next));
    };

    return (
        <div className="header">
            <button
                onClick={prevDay}
                className="prev">&lt;</button>
            <span className="shortday">{new Date(isoDate).toLocaleDateString('de-DE', {weekday: 'short'})}.</span>
            <input className="date-picker" type="date"
                value={isoDate}
                onChange={e => setReservationDate(new Date(e.target.value))}
            />
            <button
                onClick={nextDay}
                className="next">&gt;</button>
        </div>
    )
}
