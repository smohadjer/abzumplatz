import { Loader } from './../loader/Loader';
import { MouseEventHandler } from "react";

export function Popup(props: {
    disabled: boolean;
    content: HTMLElement;
    closePopup: MouseEventHandler;
    deleteReservation: MouseEventHandler;
}) {
    return (
        <div className="lightbox">
            <div className="popup">
                {/* {props.content.dataset.reservation_id} */}
                <button disabled={props.disabled} className="close" onClick={props.closePopup}>X</button>
                <p>Möchtest du deine Reservierung am {props.content.dataset.reservation_date} stornien?</p>
                <button disabled={props.disabled} className="delete" onClick={props.deleteReservation}>Ja</button> {' '}
                <button disabled={props.disabled} onClick={props.closePopup}>Nein</button>
                {props.disabled ? <Loader /> : null}
            </div>
        </div>
    )
}
