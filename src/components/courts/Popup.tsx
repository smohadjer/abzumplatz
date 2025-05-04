import { MouseEventHandler } from "react";
import {
    getLocalDate,
    deleteReservation,
    makeReservation
} from './../../utils/utils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './../../store';
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
    const user = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const reservationData = {
        club_id: user.club_id,
        user_id: user._id,
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
                    <p>Möchten Sie Ihre Reservierung am {getLocalDate(slot.date)} um {slot.hour} Uhr stornien?</p>
                    {slot.recurring && <p>Diese Reservierung wird jede Woche zur gleichen Zeit wiederholt.</p>}
                    <form
                        method="POST"
                        action={`/api/reservations?reservation_id=${slot.reservation_id}&club_id=${user.club_id}`}
                        onSubmit={(event) => {
                            props.setDisabled(true);
                            deleteReservation(event, props.closePopup, successCallback);
                        }}>
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
