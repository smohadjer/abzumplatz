import { MouseEventHandler, ReactElement } from "react";
import './popup.css';

export function Popup(props: {
    disabled: boolean;
    closePopup: MouseEventHandler;
    children: ReactElement;
}) {

    return (
        <div className="lightbox">
            <div className="popup">
                <button className="close" disabled={props.disabled} onClick={props.closePopup}>X</button>
                {props.children}
            </div>
        </div>
    )
}
