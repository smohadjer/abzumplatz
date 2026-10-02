import { useSelector } from 'react-redux';
import { RootState } from './../../store';
import { getInactiveUserMessage } from './../../messages';
import { MouseEvent, SubmitEventHandler, useRef, useState } from "react";
import { Loader } from './../loader/Loader';
import { Court } from '../../types';
import { Link } from 'react-router';
import { isReservationTimeInPast } from '../../utils/reservationTime';

type Props = {
    submitHandler: SubmitEventHandler<HTMLFormElement>;
    disabled: boolean;
    courts: Court[];
    selectedCourtNumber: string;
    date: string;
    occurrenceDate?: string;
    deleteDate?: string;
    startHour: number;
    clubStartHour: number;
    clubEndHour: number;
    clubTimeZone: string;
    maxReservationDuration: number;
    reservationId?: string;
    selectedCourtNumbers?: string[];
    duration?: number;
    label?: string;
    recurring?: boolean;
    showAssignToMe?: boolean;
    includeDeleteControls?: boolean;
    submitLabel?: string;
};

export function ReservationForm(props: Props) {
    const user = useSelector((state: RootState) => state.auth);
    const users = useSelector((state: RootState) => state.users);
    const [formError, setFormError] = useState('');
    const [showDeleteScope, setShowDeleteScope] = useState(false);
    const deleteInputRef = useRef<HTMLInputElement>(null);
    const adminName = users.loaded && users.clubId === user.club_id
        ? (() => {
            const adminUser = users.value.find(member => member.role === 'admin');
            return adminUser ? `${adminUser.first_name} ${adminUser.last_name}`.trim() : '';
        })()
        : '';
    const capitalizeName = (value: string | undefined) => {
        if (!value) {
            return '';
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    };
    const clubHours = Array.from({
        length: props.clubEndHour - props.clubStartHour
    }, (_, i) => i + props.clubStartHour);
    const playerMaxDuration = Math.min(2, Math.max(1, Math.floor(props.maxReservationDuration)));
    const durationOptions = user.role === 'admin'
        ? [1,2,3,4,5,6,7,8,9,10]
        : Array.from({length: playerMaxDuration}, (_, index) => index + 1);
    const readonlyDuration = props.duration ?? 1;
    const generatedUserLabel = [
        capitalizeName(user.first_name),
        capitalizeName(user.last_name)
    ].filter(Boolean).join(' ');
    const labelDefaultValue = props.reservationId ? props.label : (props.label ?? generatedUserLabel);
    const selectedCourtNumbers = props.selectedCourtNumbers ?? [props.selectedCourtNumber];
    const courtOptions = props.courts.map((court, index) => ({
        number: (index + 1).toString(),
        status: court.status
    }));
    const confirmDeletion = (event: MouseEvent<HTMLButtonElement>) => {
        if (deleteInputRef.current) {
            deleteInputRef.current.disabled = true;
        }
        if (!confirm('Möchten Sie diese Reservierung wirklich löschen?')) {
            event.preventDefault();
            return;
        }
        if (deleteInputRef.current) {
            deleteInputRef.current.disabled = false;
        }
    };
    const submitHandler: SubmitEventHandler<HTMLFormElement> = (event) => {
        const form = event.currentTarget;
        const courtCheckbox = form.querySelector<HTMLInputElement>('input[name="court_nums"]');
        setFormError('');
        courtCheckbox?.setCustomValidity('');

        if (deleteInputRef.current && !deleteInputRef.current.disabled) {
            props.submitHandler(event);
            deleteInputRef.current.disabled = true;
            return;
        }

        if (user.role !== 'admin' && user.status === 'inactive') {
            event.preventDefault();
            alert(getInactiveUserMessage(adminName));
            return;
        }

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
        // Skip this frontend past-time check for recurring edits.
        // The backend decides the effective recurring edit boundary from the
        // clicked occurrence date and the current series state.
        if (!props.recurring && isReservationTimeInPast(dateValue, startTime, props.clubTimeZone)) {
            event.preventDefault();
            setFormError('Eine Reservierung in der Vergangenheit ist nicht möglich.');
            return;
        }

        if ((startTime + duration) > props.clubEndHour) {
            event.preventDefault();
            setFormError('Die Reservierung endet nach der erlaubten Reservierungszeit des Vereins.');
            return;
        }

        props.submitHandler(event);
        if (deleteInputRef.current) {
            deleteInputRef.current.disabled = true;
        }
    };

    return (
        <form
            className={props.reservationId ? 'edit-reservation-form' : undefined}
            method="POST"
            action="/api/reservations"
            onSubmit={submitHandler}>
            {props.reservationId && <input type="hidden" name="reservation_id" value={props.reservationId} />}
            {props.reservationId && props.occurrenceDate && <input type="hidden" name="occurrence_date" value={props.occurrenceDate} />}
            {props.includeDeleteControls ? <input disabled name="delete" ref={deleteInputRef} type="hidden" value="true" /> : null}
            {props.includeDeleteControls ? <input name="delete_date" type="hidden" value={props.deleteDate ?? props.date} /> : null}
            {props.includeDeleteControls && !props.recurring ? <input name="delete_type" type="hidden" value="all" /> : null}
            {user.role !== 'admin' && <input type="hidden" name="label" value={labelDefaultValue} />}
            <div className="reservation-field">
                <label htmlFor="reservation-date">Datum:</label>
                <input id="reservation-date" name="date" type="date" defaultValue={props.date} readOnly={user.role !== 'admin'} required />
            </div>
            <div className="reservation-field">
                <label htmlFor="reservation-start-time">Startzeit:</label>
                {user.role === 'admin' ? (
                    <select id="reservation-start-time" className="time-select" name="start_time" defaultValue={props.startHour}>
                        {clubHours.map(hour => (
                            <option value={hour} key={hour}>
                                {hour}:00 Uhr
                            </option>
                        ))}
                    </select>
                ) : (
                    <>
                        <input type="hidden" name="start_time" value={props.startHour} />
                        <input id="reservation-start-time" type="text" readOnly value={`${props.startHour}:00 Uhr`} />
                    </>
                )}
            </div>
            <div className="reservation-field court-selection">
                <span>{user.role === 'admin' ? 'Plätze:' : 'Platz:'}</span>
                <div className="court-selection-options">
                    {user.role === 'admin' ? courtOptions.map((court) => (
                            <label
                                className={court.status === 'inactive' ? 'disabled' : undefined}
                                key={court.number}>
                                <input
                                    defaultChecked={selectedCourtNumbers.includes(court.number)}
                                    disabled={court.status === 'inactive'}
                                    name="court_nums"
                                    onChange={(event) => event.currentTarget.form
                                        ?.querySelector<HTMLInputElement>('input[name="court_nums"]')
                                        ?.setCustomValidity('')}
                                    type="checkbox"
                                    value={court.number}
                                />
                                Platz {court.number}
                            </label>
                        )) : (
                            <>
                                <input type="hidden" name="court_nums" value={props.selectedCourtNumber} />
                                <span className="reservation-readonly-value">{props.selectedCourtNumber}</span>
                            </>
                        )}
                </div>
            </div>
            <div className="reservation-field">
                {user.role !== 'admin' && playerMaxDuration === 1 ? (
                    <>
                        <span>Dauer:</span>
                        <input name="duration" type="hidden" value={readonlyDuration} />
                        <span className="reservation-readonly-value">{readonlyDuration} {readonlyDuration === 1 ? 'Stunde' : 'Stunden'}</span>
                    </>
                ) : (
                    <>
                        <label htmlFor="reservation-duration">Dauer:</label>
                        <select id="reservation-duration" className="duration-select" name="duration" defaultValue={props.duration ?? 1}>
                            {durationOptions.map(duration => (
                                <option value={duration} key={duration}>{duration} h</option>
                            ))}
                        </select>
                    </>
                )}
            </div>
            {(user.role === 'admin') && <>
                <div className="reservation-field">
                        <label htmlFor="reservation-label">Label:</label>
                        <input id="reservation-label" name="label" defaultValue={labelDefaultValue} required />
                </div>
            </>}
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
            {formError && <p className="form-error-message">{formError}</p>}
            {!props.reservationId &&
                <p className="rules-notice">
                    Mit der Reservierung bestätigen Sie, dass Sie die <Link rel="noreferrer" target="_blank" to="/rules">Regeln Ihres Clubs</Link> gelesen haben und diese einhalten.
                </p>}
            {props.reservationId ?
                <>
                    <div className="form-actions">
                        <button className="primary-action-button" type="submit" disabled={props.disabled}>{props.submitLabel ?? 'Speichern'}</button>
                        {props.includeDeleteControls ? <button
                            className="delete-action-button delete-action-button--subtle"
                            type={props.recurring ? 'button' : 'submit'}
                            disabled={props.disabled}
                            onClick={event => props.recurring ? setShowDeleteScope(true) : confirmDeletion(event)}
                        >Löschen</button> : null}
                        {props.disabled ? <Loader /> : null}
                    </div>
                    {props.includeDeleteControls && props.recurring && showDeleteScope ? (
                        <div className="reservation-delete-options">
                            <label htmlFor="reservation-delete-scope">Welche Termine möchten Sie löschen?</label>
                            <select id="reservation-delete-scope" name="delete_type" defaultValue="once">
                                <option value="once">Nur diesen Termin</option>
                                <option value="once_and_future">Diesen und alle folgenden Termine</option>
                                <option value="all">Alle Termine</option>
                            </select>
                            <div className="form-actions">
                                <button className="delete-action-button" disabled={props.disabled} onClick={confirmDeletion} type="submit">Löschen</button>
                                <button className="secondary-action-button" disabled={props.disabled} onClick={() => setShowDeleteScope(false)} type="button">Abbrechen</button>
                            </div>
                        </div>
                    ) : null}
                </> :
                <div className="form-actions">
                    <button className="primary-action-button" type="submit" disabled={props.disabled}>{props.submitLabel ?? 'Reservieren'}</button>
                    {props.disabled ? <Loader /> : null}
                </div>}
        </form>
    )
}
