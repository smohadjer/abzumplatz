import { useSelector } from 'react-redux';
import { RootState } from './../../store';
import { SubmitEventHandler, useState } from "react";
import { Loader } from './../loader/Loader';
import { Court } from '../../types';

type Props = {
    submitHandler: SubmitEventHandler<HTMLFormElement>;
    disabled: boolean;
    courts: Court[];
    selectedCourtNumber: string;
    date: string;
    deleteDate?: string;
    startHour: number;
    clubStartHour: number;
    clubEndHour: number;
    reservationId?: string;
    selectedCourtNumbers?: string[];
    duration?: number;
    label?: string;
    recurring?: boolean;
    showAssignToMe?: boolean;
    includeDeleteControls?: boolean;
    submitLabel?: string;
    cancelHandler?: Function;
};

export function ReservationForm(props: Props) {
    const user = useSelector((state: RootState) => state.auth);
    const [deleteReservationChecked, setDeleteReservationChecked] = useState(false);
    const clubHours = Array.from({
        length: props.clubEndHour - props.clubStartHour
    }, (_, i) => i + props.clubStartHour);
    const durationOptions = user.role === 'admin' ? [1,2,3,4,5,6,7,8,9,10] : [1,2];
    const userDisplayName = [
        user.first_name ? `${user.first_name.charAt(0)}.` : '',
        user.last_name
    ].filter(Boolean).join(' ');
    const selectedCourtNumbers = props.selectedCourtNumbers ?? [props.selectedCourtNumber];
    const courtOptions = user.role === 'admin' ?
        props.courts.map((court, index) => ({
            number: (index + 1).toString(),
            status: court.status
        })) :
        [{
            number: props.selectedCourtNumber,
            status: 'active'
        }];
    const courtCheckboxIsReadOnly = user.role !== 'admin';
    const submitHandler: SubmitEventHandler<HTMLFormElement> = (event) => {
        const form = event.currentTarget;
        const courtCheckbox = form.querySelector<HTMLInputElement>('input[name="court_nums"]');
        courtCheckbox?.setCustomValidity('');

        if (!new FormData(form).getAll('court_nums').length) {
            event.preventDefault();
            courtCheckbox?.setCustomValidity('Bitte wählen Sie mindestens einen Platz aus.');
            courtCheckbox?.reportValidity();
            return;
        }

        props.submitHandler(event);
    };

    return (
        <form
            className={props.reservationId ? 'edit-reservation-form' : undefined}
            method="POST"
            action="/api/reservations"
            onSubmit={submitHandler}>
            {props.reservationId && <input type="hidden" name="reservation_id" value={props.reservationId} />}
            <div className="reservation-field">
                <label>Datum:</label>
                <input name="date" type="date" defaultValue={props.date} readOnly={user.role !== 'admin'} required />
            </div>
            <div className="reservation-field">
                <label>Startzeit:</label>
                <select className="time-select" name="start_time" defaultValue={props.startHour}>
                    {clubHours.map(hour => (
                        <option value={hour} key={hour}>
                            {hour}:00 Uhr
                        </option>
                    ))}
                </select>
            </div>
            <div className="reservation-field">
                <label>Dauer:</label>
                <select className="duration-select" name="duration" defaultValue={props.duration ?? 1}>
                    {durationOptions.map(duration => (
                        <option value={duration} key={duration}>{duration} h</option>
                    ))}
                </select>
            </div>
            {(user.role === 'admin') && <>
                <div className="reservation-field">
                        <label>Reservierungslabel:</label>
                        <input name="label" defaultValue={props.label ?? userDisplayName} required />
                </div>
            </>}
            <div
                className="reservation-field court-selection"
                onChange={(event) => {
                    if (event.target instanceof HTMLInputElement) {
                        event.target.form?.querySelector<HTMLInputElement>('input[name="court_nums"]')?.setCustomValidity('');
                    }
                }}>
                <span>Plätze:</span>
                <div className="court-selection-options">
                    {courtOptions.map((court) => (
                        <label
                            className={[
                                court.status === 'inactive' ? 'disabled' : '',
                                courtCheckboxIsReadOnly ? 'readonly' : ''
                            ].filter(Boolean).join(' ') || undefined}
                            key={court.number}>
                            <input
                                defaultChecked={selectedCourtNumbers.includes(court.number)}
                                disabled={court.status === 'inactive'}
                                name="court_nums"
                                onClick={courtCheckboxIsReadOnly ? (event) => event.preventDefault() : undefined}
                                onKeyDown={courtCheckboxIsReadOnly ? (event) => {
                                    if (event.key === ' ') {
                                        event.preventDefault();
                                    }
                                } : undefined}
                                readOnly={courtCheckboxIsReadOnly}
                                type="checkbox"
                                value={court.number}
                            />
                            Platz {court.number}
                        </label>
                    ))}
                </div>
            </div>
            {(user.role === 'admin') && <>
                <div className="reservation-field">
                    <span>Wiederholung:</span>
                    <div>
                        <input defaultChecked={props.recurring} type="checkbox" id="recurring" name="recurring" value="true" />
                        <label htmlFor="recurring">Wochentlich</label>
                    </div>
                </div>
            </>}
            {props.showAssignToMe &&
                <label className="checkbox-label">
                    <input
                        disabled={props.disabled}
                        name="user_id"
                        type="checkbox"
                        value={user._id}
                    />
                    <span>Reservierung mir zuweisen</span>
                </label>}
            {props.includeDeleteControls &&
                <div className="delete-reservation-panel">
                    <label className="checkbox-label">
                        <input
                            checked={deleteReservationChecked}
                            disabled={props.disabled}
                            name="delete"
                            onChange={(event) => setDeleteReservationChecked(event.target.checked)}
                            type="checkbox"
                            value="true"
                        />
                        <span>Reservierung löschen</span>
                    </label>

                    {deleteReservationChecked && <input type="hidden" name="delete_date" value={props.deleteDate ?? props.date} />}
                    {deleteReservationChecked && !props.recurring && <input type="hidden" name="delete_type" value="all" />}

                    {props.recurring && deleteReservationChecked &&
                        <div className="delete_fields">
                            <label><input type="radio" name="delete_type" value="once" /> Nur diesen Termin</label>
                            <label><input type="radio" name="delete_type" value="once_and_future" /> Diesen Termin und alle folgenden</label>
                            <label><input defaultChecked type="radio" name="delete_type" value="all" /> Alle Termine</label>
                        </div>
                    }
                </div>}
            {props.reservationId ?
                <div className="form-actions">
                    <button type="submit" disabled={props.disabled}>{props.submitLabel ?? 'Speichern'}</button>
                    {props.cancelHandler && <button type="button" disabled={props.disabled} onClick={() => props.cancelHandler?.()}>Abbrechen</button>}
                    {props.disabled ? <Loader /> : null}
                </div> :
                <>
                    <button type="submit" disabled={props.disabled}>{props.submitLabel ?? 'Reservieren'}</button>
                    {props.disabled ? <Loader /> : null}
                </>}
        </form>
    )
}
