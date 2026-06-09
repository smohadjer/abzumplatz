import { ReservationItem } from '../types';

export const isReservationActive = (reservation: ReservationItem, now = new Date()) => {
    if (reservation.recurring) {
        return true;
    }

    const reservationEndTime = new Date(reservation.date);
    reservationEndTime.setHours(reservation.end_time, 0, 0, 0);

    return reservationEndTime > now;
};
