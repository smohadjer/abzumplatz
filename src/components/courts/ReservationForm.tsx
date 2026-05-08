import { useSelector } from 'react-redux';
import { RootState } from './../../store';
import { FormEventHandler } from "react";
import { Loader } from './../loader/Loader';
import { Court } from '../../types';

type Props = {
    submitHandler: FormEventHandler;
    disabled: boolean;
    courts: Court[];
    selectedCourtNumber: string;
};

export function ReservationForm(props: Props) {
    const user = useSelector((state: RootState) => state.auth);
    const submitHandler: FormEventHandler<HTMLFormElement> = (event) => {
        const courtCheckbox = event.currentTarget.querySelector<HTMLInputElement>('input[name="court_nums"]');
        courtCheckbox?.setCustomValidity('');

        if (user.role === 'admin' && !new FormData(event.currentTarget).getAll('court_nums').length) {
            event.preventDefault();
            courtCheckbox?.setCustomValidity('Bitte wählen Sie mindestens einen Platz aus.');
            courtCheckbox?.reportValidity();
            return;
        }

        props.submitHandler(event);
    };

    return (
        <form
            method="POST"
            action="/api/reservations"
            onSubmit={submitHandler}>
            {(user.role === 'admin') && <fieldset>
                <div
                    className="court-selection"
                    onChange={(event) => {
                        if (event.target instanceof HTMLInputElement) {
                            event.target.form?.querySelector<HTMLInputElement>('input[name="court_nums"]')?.setCustomValidity('');
                        }
                    }}>
                    <span>Plätze:</span>
                    {props.courts.map((court, index) => {
                        const courtNumber = (index + 1).toString();
                        return (
                            <label
                                className={court.status === 'inactive' ? 'disabled' : undefined}
                                key={courtNumber}>
                                <input
                                    defaultChecked={courtNumber === props.selectedCourtNumber}
                                    disabled={court.status === 'inactive'}
                                    name="court_nums"
                                    type="checkbox"
                                    value={courtNumber}
                                />
                                Platz {courtNumber}
                            </label>
                        );
                    })}
                </div>
                <div className="reservation-field">
                    {/* <input defaultChecked type="radio" id="one-hour" name="duration" value="1" />
                    <label htmlFor="one-hour">Für 1 Stunde</label>
                    <input type="radio" id="two-hours" name="duration" value="2" />
                    <label htmlFor="two-hours">Für 2 Stunde</label> */}
                    <label>Dauer (Stunden):</label>
                    <select className="duration-select" name="duration">
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
                <div className="reservation-field">
                    <label>Reservierungslabel:</label>
                    <input name="label" required />
                </div>
                <div>
                    <input type="checkbox" id="recurring" name="recurring" value="true" />
                    <label htmlFor="recurring">Wiederholt sich jede Woche</label>
                </div>
            </fieldset>}
            <button type="submit" disabled={props.disabled}>Reservieren</button>
            {props.disabled ? <Loader /> : null}
        </form>
    )
}
