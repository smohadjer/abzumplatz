import {
    getLocalDate,
    editReservation,
    makeReservation,
    getClub
} from './../../utils/utils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ReservationForm } from "../courts/ReservationForm";
import { useState } from 'react';

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

type ReservationSuccess = {
    date: string;
    startHour: number;
    endHour: number;
    courtNumbers: string[];
};

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
    const [createdReservation, setCreatedReservation] = useState<ReservationSuccess | null>(null);
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
    const editDate = props.slot.recurring ? props.slot.date : reservationDate;
    const clubTimeZone = club?.timezone ?? 'Europe/Berlin';
    const getReservationSummary = (reservation: ReservationSuccess) => `Platz ${reservation.courtNumbers.join(', ')} reserviert`;
    const getReservationLabel = (reservation: ReservationSuccess) => reservation.courtNumbers.length === 1 ? 'Platz' : 'Plätze';
    const getReservationDetailsText = (reservation: ReservationSuccess) => `Reservierung über abzumplatz für ${getReservationLabel(reservation).toLowerCase()} ${reservation.courtNumbers.join(', ')}.`;
    const buildGoogleCalendarUrl = (reservation: ReservationSuccess) => {
        const pad = (value: number) => value.toString().padStart(2, '0');
        const formatCalendarDate = (date: string, hour: number) => `${date.split('-').join('')}T${pad(hour)}0000`;
        const clubName = club?.name ?? 'abzumplatz';
        const reservationSummary = getReservationSummary(reservation);
        const details = getReservationDetailsText(reservation);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(reservationSummary)}&dates=${formatCalendarDate(reservation.date, reservation.startHour)}/${formatCalendarDate(reservation.date, reservation.endHour)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(clubName)}&ctz=${encodeURIComponent(clubTimeZone)}`;
    };
    const buildAppleCalendarUrl = (reservation: ReservationSuccess) => {
        const pad = (value: number) => value.toString().padStart(2, '0');
        const formatCalendarDate = (date: string, hour: number) => `${date.split('-').join('')}T${pad(hour)}0000`;
        const escapeIcsText = (value: string) => value
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/,/g, '\\,')
            .replace(/;/g, '\\;');
        const summary = escapeIcsText(getReservationSummary(reservation));
        const description = escapeIcsText(getReservationDetailsText(reservation));
        const location = escapeIcsText(club?.name ?? 'abzumplatz');
        const uid = `abzumplatz-${reservation.date}-${reservation.startHour}-${reservation.courtNumbers.join('-')}`;
        const timeStamp = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//abzumplatz//Reservations//DE',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${timeStamp}`,
            `DTSTART;TZID=${clubTimeZone}:${formatCalendarDate(reservation.date, reservation.startHour)}`,
            `DTEND;TZID=${clubTimeZone}:${formatCalendarDate(reservation.date, reservation.endHour)}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    };
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
    const getReservationSuccessContent = (reservation: ReservationSuccess) => {
        const successCourtLabel = getReservationLabel(reservation);

        return (
            <div className="reservation-success">
                <h2>Reservierung erstellt</h2>
                <p>
                    {successCourtLabel} {reservation.courtNumbers.join(', ')} am {getLocalDate(reservation.date)} von {reservation.startHour}:00 bis {reservation.endHour}:00 Uhr.
                </p>
                <div className="success-actions">
                    <a
                        className="button-link"
                        href={buildGoogleCalendarUrl(reservation)}
                        rel="noreferrer"
                        target="_blank">
                        Zu Google Kalender hinzufügen
                    </a>
                    <a
                        className="button-link"
                        download={`abzumplatz-${reservation.date}-platz-${reservation.courtNumbers.join('-')}.ics`}
                        href={buildAppleCalendarUrl(reservation)}>
                        Zu Apple Kalender hinzufügen
                    </a>
                </div>
            </div>
        );
    };
    const getPopupContent = (slot: Slot, popupType: string) => {
        if (createdReservation) {
            return getReservationSuccessContent(createdReservation);
        }

        if (popupType === 'deleteReservation') {
            return (
                <>
                    <p>
                        {getReservationSummaryDetails(slot).map(([label, value]) => (
                            <span key={label}>{label === 'Reserviert von' ? `${label} ${value}` : `${label}: ${value}`}<br /></span>
                        ))}
                    </p>
                    {slot.recurring && (
                        <div className="recurring-edit-notice">
                            Beim Bearbeiten dieser wiederkehrenden Reservierung werden alle noch nicht begonnenen Termine dieser Serie aktualisiert.
                        </div>
                    )}

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
                        date={editDate}
                        occurrenceDate={props.slot.recurring ? slot.date : undefined}
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
                            makeReservation(event, successCallback, reservationData)
                                .then((success) => {
                                    if (success && event.target instanceof HTMLFormElement) {
                                        const formData = new FormData(event.target);
                                        const duration = Number(formData.get('duration') ?? 1);
                                        const selectedCourts = formData.getAll('court_nums').map(String);

                                        setCreatedReservation({
                                            date: String(formData.get('date') ?? slot.date),
                                            startHour: Number(formData.get('start_time') ?? slot.hour),
                                            endHour: Number(formData.get('start_time') ?? slot.hour) + duration,
                                            courtNumbers: selectedCourts.length ? selectedCourts : [slot.court_number]
                                        });
                                    }
                                })
                                .finally(() => {
                                    props.setDisabled(false);
                                });
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
