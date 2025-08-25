import { MouseEventHandler } from "react";
import {
    getLocalDate,
    deleteReservation,
    makeReservation
} from './../../utils/utils';
import { useDispatch } from 'react-redux';
import { Loader } from '../loader/Loader';
import { ReservationForm } from "../courts/ReservationForm";

import './popup.css';

type Slot = {
    date: string;
    hour: number;
    court_number: string;
    reservation_id?: string;
    recurring?: boolean;
}

export function Popup(props: {
        type: string;
        slot: Slot;
        disabled: boolean;
        setDisabled: Function;
        closePopup: MouseEventHandler;
    }) {
    const dispatch = useDispatch();
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
    const getPopupContent = (slot: Slot, popupType: string) => {
        if (popupType === 'deleteReservation') {
            return (
                <>
                    <p>Reservierungsdatum: {getLocalDate(slot.date)}<br />
                    Reservierungszeit: {slot.hour} Uhr</p>

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
                                <label><input defaultChecked type="radio" name="delete_type" value="once" /> Nur diesen Termin</label>
                                <label><input type="radio" name="delete_type" value="once_and_future" /> Diesen Termin und alle folgenden</label>
                                <label><input type="radio" name="delete_type" value="all" /> Alle Termine</label>
                            </div>
                            : <input type="hidden" name="delete_type" value="all" />
                        }
                        <button type="submit" disabled={props.disabled}>Reservierung löschen</button>
                        {props.disabled ? <Loader /> : null}
                    </form>
                </>
            );
        } else {
            return (
                <>
                    <p>Möchten Sie den Platz {slot.court_number} am {getLocalDate(slot.date)} um {slot.hour}:00 Uhr reservieren?</p>
                    <ReservationForm
                        submitHandler={(event) => {
                            props.setDisabled(true);
                            makeReservation(event, props.closePopup, successCallback, reservationData);
                        }}
                        disabled={props.disabled}
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
