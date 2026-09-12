import type { ReservationItem } from './../types';

type ZonedDateTime = {
    date: string;
    secondsSinceMidnight: number;
};

export const getZonedDateTime = (date = new Date(), timeZone: string): ZonedDateTime => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        secondsSinceMidnight: Number(values.hour) * 3600 + Number(values.minute) * 60 + Number(values.second)
    };
};

export const addDaysToIsoDate = (isoDate: string, days: number) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

export const getIsoDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export const getLocalDate = (date: string | undefined) =>
    date
        ? new Date(`${date}T00:00:00Z`).toLocaleDateString('de-DE', {timeZone: 'UTC'})
        : undefined;

export const getIsoWeekday = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

export const recurringReservationIsOnSameDay = (reservation: ReservationItem, isoDate: string) => {
    if (!reservation.recurring) return false;
    if (getIsoWeekday(reservation.date) !== getIsoWeekday(isoDate)) return false;
    if (reservation.deleted_dates?.includes(isoDate)) return false;
    if (reservation.end_date && reservation.end_date <= isoDate) return false;
    return reservation.date < isoDate;
};

export const reservationIsOnSameDay = (reservation: ReservationItem, isoDate: string) => {
    if (reservation.deleted_dates?.includes(isoDate)) return false;
    if (reservation.date === isoDate) return true;
    return recurringReservationIsOnSameDay(reservation, isoDate);
};

export const isReservationTimeInPast = (
    date: string,
    hour: number,
    timeZone: string,
    now = new Date()
) => {
    const zonedNow = getZonedDateTime(now, timeZone);
    if (date !== zonedNow.date) {
        return date < zonedNow.date;
    }

    return hour * 3600 < zonedNow.secondsSinceMidnight;
};

export const getNextActiveRecurringReservationDate = (
    reservation: ReservationItem,
    now = new Date(),
    timeZone: string
) => {
    if (!reservation.recurring) {
        return reservation.date;
    }

    const deletedDates = new Set(reservation.deleted_dates ?? []);
    const zonedNow = getZonedDateTime(now, timeZone);
    let candidate = reservation.date;

    while (candidate < zonedNow.date) {
        candidate = addDaysToIsoDate(candidate, 7);
    }

    if (candidate === zonedNow.date && reservation.start_time * 3600 < zonedNow.secondsSinceMidnight) {
        candidate = addDaysToIsoDate(candidate, 7);
    }

    while (true) {
        if (reservation.end_date && candidate >= reservation.end_date) {
            return null;
        }
        if (!deletedDates.has(candidate)) {
            return candidate;
        }
        candidate = addDaysToIsoDate(candidate, 7);
    }
};

export const isReservationActive = (
    reservation: ReservationItem,
    now = new Date(),
    timeZone: string
) => {
    if (reservation.recurring) {
        return getNextActiveRecurringReservationDate(reservation, now, timeZone) !== null;
    }

    const zonedNow = getZonedDateTime(now, timeZone);
    if (reservation.date !== zonedNow.date) {
        return reservation.date > zonedNow.date;
    }

    return reservation.end_time * 3600 > zonedNow.secondsSinceMidnight;
};
