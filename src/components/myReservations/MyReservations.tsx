import { useState } from 'react';
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
    const deleteReservation = async (
        reservation: ReservationItem,
        occurrenceDate: string,
        deleteType: DeleteType
    ) => {
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
            setReservationBeingDeleted(null);
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Die Reservierung konnte nicht storniert werden.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="my-reservations">
            <h1>Meine Buchungen {reservationLimitApplies && club &&
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
            {deleteError ? <p className="form-error-message" role="alert">{deleteError}</p> : null}
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
	                                <span className="booking-date">
	                                    {weekday} {isoDate}{item.recurring ? ' (wiederkehrend)' : ''}
	                                </span>
	                                <span className="booking-court-time">
	                                    <span className="booking-court">{courtNums.length > 1 ? 'Plätze' : 'Platz'} {courtNumsLabel}</span>
	                                    <span className="booking-time">{item.start_time}-{item.end_time} Uhr</span>
	                                </span>
	                            </span>
	                            <span className="booking-meta">
	                                <Link
	                                    aria-label="Im Kalender anzeigen"
	                                    className="button-link button-link--secondary booking-calendar-button"
	                                    title="Im Kalender anzeigen"
	                                    to={`/reservations?date=${activeDate ?? item.date}`}
	                                >Im Kalender anzeigen</Link>
	                                <button
	                                    aria-label="Stornieren"
	                                    className="booking-action booking-cancel-button delete-action-button delete-action-button--subtle icon icon--delete"
	                                    disabled={deleting}
	                                    onClick={() => {
	                                        if (item.recurring) {
	                                            setDeleteType('once');
	                                            setDeleteError('');
	                                            setReservationBeingDeleted(key);
	                                            return;
	                                        }
	                                        if (!confirm(`Möchten Sie die Reservierung am ${isoDate} wirklich stornieren?`)) return;
	                                        void deleteReservation(item, activeDate ?? item.date, 'all');
	                                    }}
	                                    title="Stornieren"
	                                    type="button"
	                                >Stornieren</button>
	                            </span>
	                            {item.recurring && reservationBeingDeleted === key ? (
	                                <div className="booking-delete-options">
	                                    <label htmlFor={`booking-delete-scope-${key}`}>Welche Termine möchten Sie stornieren?</label>
	                                    <select
	                                        id={`booking-delete-scope-${key}`}
	                                        onChange={event => setDeleteType(event.target.value as DeleteType)}
	                                        value={deleteType}
	                                    >
	                                        <option value="once">Nur diesen Termin</option>
	                                        <option value="once_and_future">Diesen und alle folgenden Termine</option>
	                                        <option value="all">Alle Termine</option>
	                                    </select>
	                                    <div className="booking-delete-actions">
	                                        <button
	                                            className="delete-action-button"
	                                            disabled={deleting}
	                                            onClick={() => {
	                                                if (!confirm(`Möchten Sie die Reservierung am ${isoDate} wirklich stornieren?`)) return;
	                                                void deleteReservation(item, activeDate ?? item.date, deleteType);
	                                            }}
	                                            type="button"
	                                        >{deleting ? 'Wird storniert…' : 'Stornieren'}</button>
	                                        <button
	                                            className="secondary-action-button"
	                                            disabled={deleting}
	                                            onClick={() => setReservationBeingDeleted(null)}
	                                            type="button"
	                                        >Abbrechen</button>
	                                    </div>
	                                </div>
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
