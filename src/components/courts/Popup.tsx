import { useState } from "react";
import {
    getLocalDate,
    editReservation,
    makeReservation,
    getClub
} from './../../utils/utils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Loader } from '../loader/Loader';
import { ReservationForm } from "../courts/ReservationForm";

import './popup.css';

type Slot = {
    date: string;
    hour: number;
    court_number: string;
    court_nums?: string[];
    club_id?: string;
    reservation_id?: string;
    end_time?: number;
    recurring?: boolean;
    user_name?: string;
    user_id?: string;
    label?: string;
    deleted_dates?: string[];
    end_date?: string;
    timestamp?: string;
}

export function Popup(props: {
        type: string;
        slot: Slot;
        disabled: boolean;
        setDisabled: Function;
        closePopup: Function;
    }) {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const [deleteReservationChecked, setDeleteReservationChecked] = useState(false);
    const reservationData = {
        court_number: props.slot.court_number,
        hour: props.slot.hour,
        date: props.slot.date,
    }
    const successCallback = (data: any) => {
        dispatch({
            type: 'reservations/fetch',
            payload: {
                value: data,
                loaded: true
            }
        });
    }
    const formatBoolean = (value: boolean | undefined) => value ? 'Ja' : 'Nein';
    const formatTimestamp = (timestamp: string | undefined) => timestamp ? new Date(timestamp).toLocaleString('de-DE') : undefined;
    const courtNums = props.slot.court_nums ?? [props.slot.court_number];
    const courtsLabel = courtNums.length === 1 ? 'Platz' : 'Plätze';
    const getReservationDetails = (slot: Slot) => [
        ['Reserviert von', slot.user_name ? `${slot.user_name}${formatTimestamp(slot.timestamp) ? ` am ${formatTimestamp(slot.timestamp)}.` : '.'}` : undefined],
        [courtsLabel, courtNums.join(', ')],
        ['Datum', getLocalDate(slot.date)],
        ['Startzeit', `${slot.hour}:00 Uhr`],
        ['Endzeit', slot.end_time ? `${slot.end_time}:00 Uhr` : undefined],
        ['Reservierungslabel', slot.label],
        ['Wiederholt sich jede Woche', user.role === 'admin' ? formatBoolean(slot.recurring) : undefined],
        ['Gelöschte Termine', slot.deleted_dates?.map(date => getLocalDate(date)).join(', ')],
        ['Enddatum', getLocalDate(slot.end_date)],
    ].filter((detail) => detail[1] !== undefined && detail[1] !== '');
    const getReservationSummaryDetails = (slot: Slot) => {
        const details = getReservationDetails(slot);
        return details.slice(0, 1);
    };
    const getPopupContent = (slot: Slot, popupType: string) => {
        if (popupType === 'deleteReservation') {
            return (
                <>
                    <p>
                        {getReservationSummaryDetails(slot).map(([label, value]) => (
                            <span key={label}>{label === 'Reserviert von' ? `${label} ${value}` : `${label}: ${value}`}<br /></span>
                        ))}
                    </p>

                    <form
                        className="edit-reservation-form"
                        method="POST"
                        action="/api/reservations"
                        onSubmit={async (event) => {
                            props.setDisabled(true);
                            const success = await editReservation(event, successCallback);
                            props.setDisabled(false);
                            if (success) {
                                props.closePopup();
                            }
                        }}>
                        <input type="hidden" name="reservation_id" value={slot.reservation_id} />
                        {user.role === 'admin' && slot.user_id !== user._id &&
                            <label className="checkbox-label">
                                <input
                                    disabled={props.disabled}
                                    name="user_id"
                                    type="checkbox"
                                    value={user._id}
                                />
                                <span>Reservierung mir zuweisen</span>
                            </label>}

                        <div className="delete-reservation-panel">
                            {deleteReservationChecked && <input type="hidden" name="date" value={slot.date} />}
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

                            {deleteReservationChecked && !slot.recurring && <input type="hidden" name="delete_type" value="all" />}

                            {slot.recurring && deleteReservationChecked &&
                                <div className="delete_fields">
                                    <label><input type="radio" name="delete_type" value="once" /> Nur diesen Termin</label>
                                    <label><input type="radio" name="delete_type" value="once_and_future" /> Diesen Termin und alle folgenden</label>
                                    <label><input defaultChecked type="radio" name="delete_type" value="all" /> Alle Termine</label>
                                </div>
                            }
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={props.disabled}>Speichern</button>
                            <button type="button" disabled={props.disabled} onClick={() => props.closePopup()}>Abbrechen</button>
                            {props.disabled ? <Loader /> : null}
                        </div>
                    </form>
                </>
            );
        } else {
            return (
                <>
                    <ReservationForm
                        submitHandler={(event) => {
                            props.setDisabled(true);
                            makeReservation(event, props.closePopup, successCallback, reservationData);
                        }}
                        disabled={props.disabled}
                        courts={club?.courts ?? []}
                        selectedCourtNumber={slot.court_number}
                        date={slot.date}
                        startHour={slot.hour}
                        clubStartHour={club?.start_hour ?? slot.hour}
                        clubEndHour={club?.end_hour ?? slot.hour + 1}
                    />
                </>
            );
        }
    };

    return (
        <div className="lightbox">
            <div className="popup">
                <button className="close" disabled={props.disabled} onClick={() => props.closePopup()}>X</button>
                {getPopupContent(props.slot, props.type)}
            </div>
        </div>
    )
}
