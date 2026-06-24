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
    editFromDate?: string;
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
    const capitalizeName = (value: string | undefined) => {
        if (!value) {
            return '';
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    };
    const clubHours = Array.from({
        length: props.clubEndHour - props.clubStartHour
    }, (_, i) => i + props.clubStartHour);
    const durationOptions = user.role === 'admin' ? [1,2,3,4,5,6,7,8,9,10] : [1,2];
    const generatedUserLabel = [
        capitalizeName(user.first_name),
        capitalizeName(user.last_name)
    ].filter(Boolean).join(' ');
    const labelDefaultValue = props.reservationId ? props.label : (props.label ?? generatedUserLabel);
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
        const durationSelect = form.querySelector<HTMLSelectElement>('select[name="duration"]');
        courtCheckbox?.setCustomValidity('');
        durationSelect?.setCustomValidity('');

        if (!new FormData(form).getAll('court_nums').length) {
            event.preventDefault();
            courtCheckbox?.setCustomValidity('Bitte wählen Sie mindestens einen Platz aus.');
            courtCheckbox?.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const startTime = Number(formData.get('start_time') ?? props.startHour);
        const duration = Number(formData.get('duration') ?? 1);
        const dateValue = String(formData.get('date') ?? props.date);
        const editFromDateValue = String(formData.get('edit_from_date') ?? dateValue);
        const editFromReservationTime = new Date(editFromDateValue);
        editFromReservationTime.setHours(props.startHour, 0, 0, 0);
        const reservationTime = new Date(dateValue);
        reservationTime.setHours(startTime, 0, 0, 0);

        if (props.reservationId && props.recurring && editFromReservationTime < new Date()) {
            event.preventDefault();
            durationSelect?.setCustomValidity('Vergangene Reservierungen können nicht bearbeitet werden.');
            durationSelect?.reportValidity();
            return;
        }

        if (reservationTime < new Date()) {
            event.preventDefault();
            durationSelect?.setCustomValidity('Eine Reservierung in der Vergangenheit ist nicht möglich.');
            durationSelect?.reportValidity();
            return;
        }

        if ((startTime + duration) > props.clubEndHour) {
            event.preventDefault();
            durationSelect?.setCustomValidity('Die Reservierung endet nach der erlaubten Reservierungszeit des Vereins.');
            durationSelect?.reportValidity();
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
            {props.reservationId && props.editFromDate && <input type="hidden" name="edit_from_date" value={props.editFromDate} />}
            {!props.reservationId && user.role !== 'admin' && <input type="hidden" name="label" value={labelDefaultValue} />}
            <div className="reservation-field">
                <label>Datum:</label>
                <input name="date" type="date" defaultValue={props.date} readOnly={user.role !== 'admin'} required />
            </div>
            <div className="reservation-field">
                <label>Startzeit:</label>
                {user.role === 'admin' ? (
                    <select className="time-select" name="start_time" defaultValue={props.startHour}>
                        {clubHours.map(hour => (
                            <option value={hour} key={hour}>
                                {hour}:00 Uhr
                            </option>
                        ))}
                    </select>
                ) : (
                    <>
                        <input type="hidden" name="start_time" value={props.startHour} />
                        <input type="text" readOnly value={`${props.startHour}:00 Uhr`} />
                    </>
                )}
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
                        <input name="label" defaultValue={labelDefaultValue} required />
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
                        name="assign_to_myself"
                        type="checkbox"
                        value="true"
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
