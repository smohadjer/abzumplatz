import { Loader } from './../loader/Loader';
import { MouseEventHandler } from "react";
import './popup.css';

export function Popup(props: {
    disabled: boolean;
    content: HTMLElement;
    closePopup: MouseEventHandler;
    clickHandler: MouseEventHandler;
    type: string;
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
                {props.type === 'delete' ? (
                <>
                    <p>Möchten Sie Ihre Reservierung am {getReservationDate(props.content.dataset.date)} um {props.content.dataset.hour} Uhr stornien?</p>
                    <button disabled={props.disabled} onClick={props.clickHandler}>Ja</button>
                </>) : (
                <>
                    <p>Möchten Sie den Platz {props.content.dataset.court_number} am {getReservationDate(props.content.dataset.date)} um {props.content.dataset.hour} Uhr buchen?</p>
                    <button disabled={props.disabled} onClick={props.clickHandler}>Ja</button>
                </>)}

                {' '}
                <button disabled={props.disabled} onClick={props.closePopup}>Nein</button>
                {props.disabled ? <Loader /> : null}
            </div>
        </div>
    )
}
