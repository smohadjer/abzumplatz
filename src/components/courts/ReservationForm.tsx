import { useSelector } from 'react-redux';
import { RootState } from './../../store';
import { FormEventHandler } from "react";
import { Loader } from './../loader/Loader';

type Props = {
    submitHandler: FormEventHandler;
    disabled: boolean;
};

export function ReservationForm(props: Props) {
    const user = useSelector((state: RootState) => state.auth);

    return (
        <form
            method="POST"
            action="/api/reservations"
            onSubmit={props.submitHandler}>
            {(user.role === 'admin') && <fieldset>
                <div>
                    {/* <input defaultChecked type="radio" id="one-hour" name="duration" value="1" />
                    <label htmlFor="one-hour">Für 1 Stunde</label>
                    <input type="radio" id="two-hours" name="duration" value="2" />
                    <label htmlFor="two-hours">Für 2 Stunde</label> */}
                    <label>Dauer (Stunden):</label>
                    <select name="duration">
                        <option defaultChecked value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                    </select>
                </div>
                <div>
                    <label>Reservierungslabel:</label>
                    <input name="label" />
                </div>
                <div>
                    <input type="checkbox" id="recurring" name="recurring" value="true" />
                    <label htmlFor="recurring">Wird jede Woche zur gleichen Zeit wiederholt</label>
                </div>
            </fieldset>}
            <button type="submit" disabled={props.disabled}>Reservieren</button>
            {props.disabled ? <Loader /> : null}
        </form>
    )
}
