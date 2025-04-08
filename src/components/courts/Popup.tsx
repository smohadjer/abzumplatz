import { Loader } from './../loader/Loader';
import { MouseEventHandler } from "react";

export function Popup(props: {
    disabled: boolean;
    content: HTMLElement;
    closePopup: MouseEventHandler;
    deleteReservation: MouseEventHandler;
}) {
    const getReservationDate = (date: string | undefined) => {
        if (date) {
            const day = new Date(date);
            return day.toLocaleDateString('de-DE');
        }
    };

    return (
        <div className="lightbox">
            <div className="popup">
                {/* {props.content.dataset.reservation_id} */}
                <button disabled={props.disabled} className="close" onClick={props.closePopup}>X</button>
                <p>Möchtest du deine Reservierung am {getReservationDate(props.content.dataset.reservation_date)} stornien?</p>
                <button disabled={props.disabled} className="delete" onClick={props.deleteReservation}>Ja</button> {' '}
                <button disabled={props.disabled} onClick={props.closePopup}>Nein</button>
                {props.disabled ? <Loader /> : null}
            </div>
        </div>
    )
}
