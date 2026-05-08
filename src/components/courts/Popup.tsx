import { MouseEventHandler } from "react";
import {
    getLocalDate,
    assignReservation,
    deleteReservation,
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
        closePopup: MouseEventHandler;
    }) {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const club = getClub();
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
    const getReservationDetails = (slot: Slot) => [
        ['Reserviert von', slot.user_name],
        ['Plätze', slot.court_nums?.join(', ') ?? slot.court_number],
        ['Datum', getLocalDate(slot.date)],
        ['Startzeit', `${slot.hour}:00 Uhr`],
        ['Endzeit', slot.end_time ? `${slot.end_time}:00 Uhr` : undefined],
        ['Reservierungslabel', slot.label],
        ['Wiederholt sich jede Woche', formatBoolean(slot.recurring)],
        ['Gelöschte Termine', slot.deleted_dates?.map(date => getLocalDate(date)).join(', ')],
        ['Enddatum', getLocalDate(slot.end_date)],
        ['Erstellt am', slot.timestamp ? new Date(slot.timestamp).toLocaleString('de-DE') : undefined],
    ].filter((detail) => detail[1] !== undefined && detail[1] !== '');
    const getPopupContent = (slot: Slot, popupType: string) => {
        if (popupType === 'deleteReservation') {
            return (
                <>
                    <p>
                        {getReservationDetails(slot).map(([label, value]) => (
                            <span key={label}>{label}: {value}<br /></span>
                        ))}
                    </p>

                    {user.role === 'admin' && slot.user_id !== user._id && <button
                        type="button"
                        disabled={props.disabled}
                        onClick={() => {
                            props.setDisabled(true);
                            assignReservation(slot.reservation_id, props.closePopup, successCallback);
                        }}>Reservierung mir zuweisen</button>}

                    <div className="delete-reservation-panel">
                        {slot.recurring && <p>Dies ist eine wiederkehrende Reservierung. Bitte wählen Sie aus, wie Sie sie löschen möchten:</p>}

                        <form
                            method="POST"
                            action={`/api/reservations?reservation_id=${slot.reservation_id}`}
                            onSubmit={(event) => {
                                props.setDisabled(true);
                                deleteReservation(event, props.closePopup, successCallback);
                            }}>
                            <input type="hidden" name="form_method" value="delete" />
                            <input type="hidden" name="date" value={slot.date} />
                            {slot.recurring ?
                                <div className="delete_fields">
                                    <label><input type="radio" name="delete_type" value="once" /> Nur diesen Termin</label>
                                    <label><input type="radio" name="delete_type" value="once_and_future" /> Diesen Termin und alle folgenden</label>
                                    <label><input defaultChecked type="radio" name="delete_type" value="all" /> Alle Termine</label>
                                </div>
                                : <input type="hidden" name="delete_type" value="all" />
                            }
                            <button type="submit" disabled={props.disabled}>Reservierung löschen</button>
                            {props.disabled ? <Loader /> : null}
                        </form>
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <p>Reservierung am {getLocalDate(slot.date)} um {slot.hour}:00 Uhr</p>
                    <ReservationForm
                        submitHandler={(event) => {
                            props.setDisabled(true);
                            makeReservation(event, props.closePopup, successCallback, reservationData);
                        }}
                        disabled={props.disabled}
                        courts={club?.courts ?? []}
                        selectedCourtNumber={slot.court_number}
                    />
                </>
            );
        }
    };

    return (
        <div className="lightbox">
            <div className="popup">
                <button className="close" disabled={props.disabled} onClick={props.closePopup}>X</button>
                {getPopupContent(props.slot, props.type)}
            </div>
        </div>
    )
}
