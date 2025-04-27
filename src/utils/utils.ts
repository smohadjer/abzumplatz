import { useSelector } from 'react-redux';
import { RootState } from './../store';

// Deep cloning arrays and objects with support for older browsers
export const deepClone = (item: {} | []) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(item);
    } else {
        return JSON.parse(JSON.stringify(item));
    }
};

export const isAuthenticated = async () => {
    const response = await fetch('/api/verifyAuth');
    const isAuthenticated = await response.json();
    return isAuthenticated;
};

export const isInPast = (reservationDate: Date, hour: number) => {
    const reservationTime = new Date(reservationDate);
    reservationTime.setHours(hour);
    reservationTime.setMinutes(0);
    reservationTime.setSeconds(0);
    if (reservationTime < new Date()) {
        return true;
    } else {
        return false;
    }
};

export const getClub = () => {
    const auth = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs);
    const club_id = auth.club_id;
    const club = clubs.value.find(club => club._id === club_id);
    return club;
};

export const getDayName = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {weekday: 'short'});
}

// get a recurring reservation item and returns true if it's older and
// on the same day of the week as provided date
export const recurringReservationIsOnSameDay = (item: {
    date: string;
    recurring: boolean;
}, isoDate: string) => {
    return item.recurring && (getDayName(item.date) === getDayName(isoDate)) && (new Date(item.date) < new Date(isoDate));
};

export const getLocalDate = (date: string | undefined) => {
    if (date) {
        const day = new Date(date);
        return day.toLocaleDateString('de-DE');
    }
};
