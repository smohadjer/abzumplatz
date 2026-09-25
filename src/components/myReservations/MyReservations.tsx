import { FormEvent, useState } from 'react';
import { ReservationItem } from '../../types';
import { getClub } from './../../utils/utils';
import { getNextActiveRecurringReservationDate } from '../../utils/reservationTime';
import { Link } from 'react-router';
import { useDispatch } from 'react-redux';

type DeleteType = 'once' | 'once_and_future' | 'all';

export function MyReservations(props: {
    reservations:  ReservationItem[];
    reservationLimitApplies: boolean;
}) {
    const dispatch = useDispatch();
    const { reservations, reservationLimitApplies } = props;
    const [reservationBeingDeleted, setReservationBeingDeleted] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<DeleteType>('once');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const club = getClub();
    const reservationsLimit = club?.reservations_limit;
    const reservationLimitReached = reservationLimitApplies
        && reservationsLimit != null
        && reservations.length >= reservationsLimit;
    const remainingReservations = reservationLimitApplies && reservationsLimit != null
        ? Math.max(reservationsLimit - reservations.length, 0)
        : null;
    const sortedReservations = [...reservations].sort((first, second) => {
        const firstDate = first.recurring && club ? getNextActiveRecurringReservationDate(first, new Date(), club.timezone) : first.date;
        const secondDate = second.recurring && club ? getNextActiveRecurringReservationDate(second, new Date(), club.timezone) : second.date;
        const dateDifference = new Date(firstDate ?? first.date).getTime() - new Date(secondDate ?? second.date).getTime();

        return dateDifference || first.start_time - second.start_time;
    });
    const openDeleteConfirmation = (reservationId: string) => {
        setReservationBeingDeleted(reservationId);
        setDeleteType('once');
        setDeleteError('');
    };
    const closeDeleteConfirmation = () => {
        setReservationBeingDeleted(null);
        setDeleteError('');
    };
    const deleteReservation = async (
        event: FormEvent<HTMLFormElement>,
        reservation: ReservationItem,
        occurrenceDate: string
    ) => {
        event.preventDefault();
        setDeleting(true);
        setDeleteError('');

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reservation_id: reservation._id,
                    delete: 'true',
                    delete_type: reservation.recurring ? deleteType : 'all',
                    date: occurrenceDate
                })
            });
            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error ?? 'Die Reservierung konnte nicht storniert werden.');
            }

            dispatch({
                type: 'reservations/fetch',
                payload: {value: result.data, loaded: true}
            });
            closeDeleteConfirmation();
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Die Reservierung konnte nicht storniert werden.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="my-reservations">
            <h1>Meine Reservierungen {club &&
                reservationsLimit != null &&
                <span>({reservations.length} von {String(reservationsLimit)})</span>}
            </h1>
            {reservationLimitReached ? (
                <p className="reservation-limit-warning" role="status">
                    Sie haben die maximale Anzahl aktiver Reservierungen erreicht. Stornieren Sie eine Reservierung, bevor Sie eine neue vornehmen können.
                </p>
            ) : null}
            {remainingReservations != null && remainingReservations > 0 ? (
                <p className="reservation-limit-availability" role="status">
                    Sie können noch {remainingReservations} {remainingReservations === 1 ? 'Reservierung' : 'Reservierungen'} vornehmen.
                </p>
            ) : null}
            {reservations.length ?
                <ul>
                {sortedReservations.map(item => {
                    const activeDate = item.recurring && club ? getNextActiveRecurringReservationDate(item, new Date(), club.timezone) : item.date;
                    const day = new Date(`${activeDate ?? item.date}T00:00:00Z`);
                    const isoDate = day.toLocaleDateString('de-DE', {timeZone: 'UTC'});
                    const weekday = day.toLocaleDateString('de-DE', {weekday: 'short', timeZone: 'UTC'});
                    const key = item._id!.toString();
                    const courtNums = item.court_nums;
                    const courtNumsLabel = courtNums.join(', ');

	                    return (
	                        <li key={key}>
	                            {item.label ? <span className="booking-label">{item.label}</span> : null}
	                            <span className="booking-date-time">
	                                {weekday} {isoDate}, {item.start_time}-{item.end_time} Uhr
                                    {item.recurring ? ' (wiederkehrend)' : ''}
	                                {' · '}
	                                <span className="booking-court">{courtNums.length > 1 ? 'Plätze' : 'Platz'} {courtNumsLabel}</span>
	                            </span>
	                            <span className="booking-meta">
	                                <Link
	                                    aria-label="Im Kalender anzeigen"
	                                    className="booking-action icon icon--calendar"
	                                    title="Im Kalender anzeigen"
	                                    to={`/reservations?date=${activeDate ?? item.date}`}
	                                >Im Kalender anzeigen</Link>
	                                <button
	                                    aria-label="Stornieren"
	                                    className="booking-action booking-cancel-button delete-action-button icon icon--delete"
	                                    onClick={() => openDeleteConfirmation(key)}
	                                    title="Stornieren"
	                                    type="button"
	                                >Stornieren</button>
	                            </span>
                                {reservationBeingDeleted === key ? (
                                    <form
                                        className="booking-delete-confirmation"
                                        onSubmit={(event) => deleteReservation(event, item, activeDate ?? item.date)}
                                    >
                                        <p><strong>Reservierung am {isoDate} wirklich stornieren?</strong></p>
                                        {item.recurring ? (
                                            <fieldset>
                                                <legend>Welche Termine möchten Sie stornieren?</legend>
                                                <label><input checked={deleteType === 'once'} name={`delete-type-${key}`} onChange={() => setDeleteType('once')} type="radio" /> Nur diesen Termin am {isoDate}</label>
                                                <label><input checked={deleteType === 'once_and_future'} name={`delete-type-${key}`} onChange={() => setDeleteType('once_and_future')} type="radio" /> Diesen und alle folgenden Termine</label>
                                                <label><input checked={deleteType === 'all'} name={`delete-type-${key}`} onChange={() => setDeleteType('all')} type="radio" /> Alle Termine der Serie</label>
                                            </fieldset>
                                        ) : null}
                                        {deleteError ? <p className="form-error-message" role="alert">{deleteError}</p> : null}
                                        <div className="booking-delete-actions">
                                            <button className="delete-action-button" disabled={deleting} type="submit">{deleting ? 'Wird storniert…' : 'Stornieren bestätigen'}</button>
                                            <button disabled={deleting} onClick={closeDeleteConfirmation} type="button">Abbrechen</button>
                                        </div>
                                    </form>
                                ) : null}
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
