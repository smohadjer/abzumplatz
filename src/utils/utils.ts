import { useSelector } from 'react-redux';
import { RootState } from './../store';
import { FormEvent } from "react";


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

export const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

export const getClub = () => {
    const auth = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs);
    const club_id = auth.club_id;
    const club = clubs.value.find(club => club._id === club_id);
    return club;
};

export const getUserReservations = () => {
    const user = useSelector((state: RootState) => state.auth);
    const reservations = useSelector((state: RootState) => state.reservations.value);
    const userReservations = reservations.filter(item => item.user_id === user._id);
    const validUserReservations = userReservations.filter(item => (item.recurring ||
        (!item.recurring && item.date >= new Date().toISOString().split('T')[0]))
    )
    return validUserReservations;
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

export const deleteReservation = (event: FormEvent, closePopup: Function, successCallback: Function) => {
    event.preventDefault();

    if (event.target instanceof HTMLFormElement) {
        const form: HTMLFormElement = event.target!;
        fetch(form.action, {
            method: 'DELETE'
        })
        .then((response) => response.json())
        .then(json => {
            if (json.error) {
                console.error(json.error);
                alert(json.error);
            } else {
                if (json.data) {
                    successCallback(json.data);
                }
            }
        })
        .finally(() => {
            closePopup();
        });
    }
};

export const makeReservation = (event: FormEvent, closePopup: Function, successCallback: Function, reservationData: any) => {
    event.preventDefault();

    if (event.target instanceof HTMLFormElement) {
        const form: HTMLFormElement = event.target!;
        const formData = new FormData(form);
        const duration = Number(formData.get('duration') ?? 1);
        const label = formData.get('label');
        const recurring = formData.get('recurring') ?? false;

        const data = {
            club_id: reservationData.club_id,
            user_id: reservationData.user_id,
            court_num: reservationData.court_number,
            start_time: reservationData.hour,
            end_time:  reservationData.hour + duration,
            date: reservationData.date,
            label,
            recurring
        };

        fetch(form.action, {
            method: form.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then(json => {
            if (json.error) {
                console.error(json.error);
                alert(json.error);
            } else {
                if (json.data) {
                    successCallback(json.data);
                }
            }
        })
        .finally(() => {
            closePopup();
        });
    }
};
