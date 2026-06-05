import { useSelector } from 'react-redux';
import { RootState, AppDispatch } from './../store';
import { FormEvent } from "react";
import * as mongoDB from "mongodb";
import { ReservationItem, StateUser } from './../types';

export async function fetchJson(path: string) {
  const response = await fetch(path);
  const responseJson = await response.json();
  return responseJson;
}

// Deep cloning arrays and objects with support for older browsers
export const deepClone = (item: {} | []) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(item);
    } else {
        return JSON.parse(JSON.stringify(item));
    }
};

export const isAuthenticated = async () => {
    try {
        const response = await fetch('/api/verifyAuth');
        const isAuthenticated = await response.json();
        return isAuthenticated;
    } catch(error) {
        console.error('error', error);
        return null;
    }
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

// checks if a recurring reservation in the past falls on provided date
export const recurringReservationIsOnSameDay = (reservationItem: ReservationItem, isoDate: string) => {
    if (!reservationItem.recurring) return false;
    if (getDayName(reservationItem.date) !== getDayName(isoDate)) return false;
    if (reservationItem.deleted_dates && reservationItem.deleted_dates.find(item => item === isoDate)) return false;
    if (reservationItem.end_date && (new Date(reservationItem.end_date) <= new Date(isoDate))) return false;
    return (new Date(reservationItem.date) < new Date(isoDate));
};

export const reservationIsOnSameDay = (reservationItem: ReservationItem, isoDate: string) => {
    if (reservationItem.deleted_dates && reservationItem.deleted_dates.find(item => item === isoDate)) return false;
    if (reservationItem.date === isoDate) return true;
    return recurringReservationIsOnSameDay(reservationItem, isoDate);
};

export const getLocalDate = (date: string | undefined) => {
    if (date) {
        const day = new Date(date);
        return day.toLocaleDateString('de-DE');
    }
};

export const editReservation = (
    event: FormEvent,
    successCallback: Function): Promise<boolean> => {
    event.preventDefault();

    if (event.target instanceof HTMLFormElement) {
        const form: HTMLFormElement = event.target!;
        const formData = new FormData(form);

        if (!formData.get('reservation_id')) {
            alert('Reservierung nicht gefunden');
            return Promise.resolve(false);
        }

        const data = formData.get('delete') === 'true' ?
            {
                ...Object.fromEntries(formData),
                date: formData.get('delete_date') ?? formData.get('date')
            } :
            {
                reservation_id: formData.get('reservation_id'),
                ...getReservationPayload(formData),
                ...(formData.get('user_id') ? {user_id: formData.get('user_id')} : {})
            };

        return fetch(form.action, {
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
                return false;
            } else {
                if (json.data) {
                    successCallback(json.data);
                }
                return true;
            }
        });
    }

    return Promise.resolve(false);
};

const getReservationPayload = (formData: FormData, reservationData?: any) => {
    const duration = Number(formData.get('duration') ?? 1);
    const label = formData.get('label');
    const recurring = formData.get('recurring') ?? false;
    const courtNums = formData.getAll('court_nums');
    const startTime = Number(formData.get('start_time') ?? reservationData?.hour);
    const date = formData.get('date') ?? reservationData?.date;

    return {
        club_id: reservationData?.club_id,
        user_id: reservationData?.user_id,
        ...(courtNums.length ? {court_nums: courtNums} : {}),
        start_time: startTime,
        end_time:  startTime + duration,
        date,
        ...(typeof label === 'string' ? {label} : {}),
        recurring
    };
};

export const makeReservation = (
    event: FormEvent,
    successCallback: Function,
    reservationData: any): Promise<boolean> => {
    event.preventDefault();

    if (event.target instanceof HTMLFormElement) {
        const form: HTMLFormElement = event.target!;
        const formData = new FormData(form);
        const data = getReservationPayload(formData, reservationData);

        return fetch(form.action, {
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
                return false;
            } else {
                if (json.data) {
                    successCallback(json.data);
                }
                return true;
            }
        });
    }

    return Promise.resolve(false);
};

export const getAllReservations = async (
    reservations: mongoDB.Collection<ReservationItem>,
    club_id: string
) => {
    return await reservations.find({club_id}).sort({
      date: 1,
      start_time: 1
    }).toArray();
  };

export const fetchAppData = async (clubId: string, dispatch: AppDispatch) => {
    const usersEndpoint = `/api/users?club_id=${clubId}`;
    const reservationsEndpoint = `/api/reservations?club_id=${clubId}`;
    const usersRequest: Promise<StateUser[]> = fetch(usersEndpoint)
        .then(res => res.json());
    const reservationsRequest: Promise<ReservationItem[]> = fetch(reservationsEndpoint)
        .then(res => res.json());
    await Promise.all([usersRequest, reservationsRequest])
    .then(([usersJson, reservationsJson]) => {
        dispatch({
            type: 'users/fetch',
            payload: {
                value: usersJson,
                loaded: true
            }
        });
        dispatch({
            type: 'reservations/fetch',
            payload: {
                value: reservationsJson,
                loaded: true
            }
        });
    }).catch(error => {
        console.error(error);
    });
};

export const fetchClub = async (clubId: string, dispatch: AppDispatch) => {
    const path = `/api/clubs?id=${clubId}`;
    const data = await fetch(path);
    const json = await data.json();
    dispatch({
        type: 'club/fetch',
        payload: {
            value: json,
            loaded: true
        }
    });
};


export const fetchUsers = async (clubId: string, dispatch: AppDispatch) => {
    const usersEndpoint = `/api/users?club_id=${clubId}`;
    const usersData = await fetch(usersEndpoint);
    const users: StateUser[] = await usersData.json();
    dispatch({
        type: 'users/fetch',
        payload: {
            value: users,
            loaded: true
        }
    });
};

export const fetchReservations = async (clubId: string, dispatch: AppDispatch) => {
    const reservationsEndpoint = `/api/reservations?club_id=${clubId}`;
    const reservationsData = await fetch(reservationsEndpoint);
    const reservations: ReservationItem[] = await reservationsData.json();
    dispatch({
        type: 'reservations/fetch',
        payload: {
            value: reservations,
            loaded: true
        }
    });
};
