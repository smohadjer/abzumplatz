import {
    getLocalDate,
    editReservation,
    makeReservation,
    getClub
} from './../../utils/utils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ReservationForm } from "../courts/ReservationForm";

import './popup.css';

type Slot = {
    date: string;
    reservation_date?: string;
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
    const reservationDate = props.slot.reservation_date ?? props.slot.date;
    const getReservationDetails = (slot: Slot) => [
        ['Reserviert von', slot.user_name ? `${slot.user_name}${formatTimestamp(slot.timestamp) ? ` am ${formatTimestamp(slot.timestamp)}.` : '.'}` : undefined],
        [courtsLabel, courtNums.join(', ')],
        ['Datum', getLocalDate(reservationDate)],
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

                    <ReservationForm
                        submitHandler={async (event) => {
                            props.setDisabled(true);
                            const success = await editReservation(event, successCallback);
                            props.setDisabled(false);
                            if (success) {
                                props.closePopup();
                            }
                        }}
                        disabled={props.disabled}
                        courts={club?.courts ?? []}
                        selectedCourtNumber={slot.court_number}
                        selectedCourtNumbers={courtNums}
                        date={reservationDate}
                        deleteDate={slot.date}
                        startHour={slot.hour}
                        duration={slot.end_time ? slot.end_time - slot.hour : 1}
                        label={slot.label}
                        recurring={slot.recurring}
                        clubStartHour={club?.start_hour ?? slot.hour}
                        clubEndHour={club?.end_hour ?? slot.hour + 1}
                        reservationId={slot.reservation_id}
                        showAssignToMe={user.role === 'admin' && slot.user_id !== user._id}
                        includeDeleteControls={true}
                        submitLabel="Speichern"
                        cancelHandler={props.closePopup}
                    />
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
