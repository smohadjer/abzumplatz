import { useSelector } from 'react-redux';
import { RootState, AppDispatch } from './../store';
import type { SyntheticEvent } from "react";
import * as mongoDB from "mongodb";
import { ReservationItem, StateUser } from './../types';
import { isReservationActive } from './reservationTime';

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

export const getClub = () => {
    const auth = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs);
    const club_id = auth.club_id;
    const club = clubs.value.find(club => club._id === club_id);
    return club;
};

export const getUserReservations = () => {
    const user = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs);
    const reservations = useSelector((state: RootState) => state.reservations.value);
    const clubTimeZone = clubs.value.find(club => club._id === user.club_id)?.timezone;
    const userReservations = reservations.filter(item => item.user_id === user._id);
    if (!clubTimeZone) return [];
    const validUserReservations = userReservations.filter(item => isReservationActive(item, new Date(), clubTimeZone));
    return validUserReservations;
};

export const editReservation = (
    event: SyntheticEvent<HTMLFormElement>,
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
                ...(formData.get('occurrence_date') ? {occurrence_date: formData.get('occurrence_date')} : {}),
                ...getReservationPayload(formData),
                ...(formData.get('assign_to_myself') === 'true' ? {assign_to_myself: true} : {})
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
    event: SyntheticEvent<HTMLFormElement>,
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
    const reservationsEndpoint = '/api/reservations';
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
                loaded: true,
                clubId
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
            loaded: true,
            clubId
        }
    });
};

export const fetchReservations = async (dispatch: AppDispatch) => {
    const reservationsEndpoint = '/api/reservations';
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

export const onLogout = (dispatch: AppDispatch) => {
    console.log('Logging out');

    fetch('/api/logout', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then((response) => response.json())
    .then(() => {
        // reset all state
        dispatch({type: 'auth/logout', payload: {}});
        dispatch({type: 'reservations/fetch', payload: {
            value: [],
            loaded: false
        }});
        dispatch({type: 'users/fetch', payload: {
            value: [],
            loaded: false,
            clubId: ''
        }});
        dispatch({type: 'club/fetch', payload: {
            value: {
                _id: '',
                name: '',
                courts: [],
                reservations_limit: null,
                start_hour: 0,
                end_hour: 0,
            },
            loaded: false
        }});
    });
}
