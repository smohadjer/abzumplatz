import { Collection, ObjectId } from 'mongodb';
import { ReservationItem } from '../src/types.js';
import {
  getDayName,
  getLocalDate,
  reservationIsOnSameDay
} from '../src/utils/utils.js';

type ReservationErrorKey =
  'already_booked' |
  'court_selection' |
  'more_hours' |
  'multiple_courts' |
  'overlapping' |
  'reached_limit' |
  'recurring';

type ReservationErrorOptions = {
  courtNum?: string;
  limit?: number;
  localDate?: string | undefined;
};

export class ReservationValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ReservationValidationError';
    this.statusCode = statusCode;
  }
}

export const getReservationError = (key: ReservationErrorKey, options: ReservationErrorOptions = {}) => {
  switch (key) {
    case 'recurring':
      return 'Nur Administratoren können wiederkehrende Reservierungen vornehmen.';
    case 'more_hours':
      return 'Nur Administratoren können Reservierungen mit einer Dauer von mehr als zwei Stunden vornehmen.';
    case 'reached_limit':
      return `Sie haben die maximal zulässige Anzahl an Reservierungen (${options.limit}) erreicht.`;
    case 'already_booked':
      return `Platz ${options.courtNum} ist zur angegebenen Zeit nicht verfügbar.`;
    case 'overlapping':
      return `Platz ${options.courtNum} ist am ${options.localDate} zu einem Zeitpunkt gebucht, der sich mit Ihrer Buchung überschneidet.`;
    case 'multiple_courts':
      return 'Eine gleichzeitige Reservierung mehrerer Plätze ist nicht gestattet.';
    case 'court_selection':
      return 'Nur Administratoren können Plätze für eine Reservierung auswählen.';
    default:
      return 'Es ist ein Fehler aufgetreten. Bitte wenden Sie sich an den Support.';
  }
};

export const getCourtNums = (courtNumsInput: unknown) => {
  const requestedCourtNums = Array.isArray(courtNumsInput) ? courtNumsInput : [courtNumsInput];
  const courtNums = [...new Set(requestedCourtNums.map((item) => item?.toString() ?? '').filter(Boolean))];

  if (!courtNums.length) {
    throw new ReservationValidationError('At least one court is required');
  }

  return courtNums;
};

export const validateNonAdminReservationRules = (
  courtNums: string[],
  recurring: boolean,
  startTime: number,
  endTime: number,
  courtSelectionErrorKey: ReservationErrorKey = 'multiple_courts'
) => {
  if (courtNums.length !== 1) {
    throw new Error(getReservationError(courtSelectionErrorKey));
  }

  if (recurring) {
    throw new Error(getReservationError('recurring'));
  }

  if ((endTime - startTime) > 2) {
    throw new Error(getReservationError('more_hours'));
  }
};

export const validateReservationOverlap = async (
  reservations: Collection<ReservationItem>,
  clubId: string,
  courtNums: string[],
  date: string,
  startTime: number,
  endTime: number,
  recurring: boolean,
  excludedReservationId?: ObjectId
) => {
  const query = {
    ...(excludedReservationId ? {_id: {$ne: excludedReservationId}} : {}),
    club_id: clubId,
    court_nums: { $in: courtNums }
  };

  const reservationsForSelectedCourts: ReservationItem[] = await reservations.find(query).toArray();
  const overlappingHoursFilter = (item: ReservationItem) => {
    return (startTime <= item.start_time && endTime > item.start_time) ||
      (startTime >= item.start_time && startTime < item.end_time);
  };

  for (const selectedCourtNum of courtNums) {
    const reservationsForSameCourt = reservationsForSelectedCourts.filter((item) => {
      const itemCourtNums = item.court_nums.map((courtNum) => courtNum.toString());
      return itemCourtNums.includes(selectedCourtNum);
    });
    const reservationsOnSameDay = reservationsForSameCourt.filter((item) => {
      return reservationIsOnSameDay(item, date);
    });
    const reservationsWithOverlappingTime = reservationsOnSameDay.filter(overlappingHoursFilter);
    if (reservationsWithOverlappingTime.length) {
      throw new Error(getReservationError('already_booked', {courtNum: selectedCourtNum}));
    }

    if (recurring) {
      const reservationsOnSameDayInFuture = reservationsForSameCourt.filter(item => {
        return getDayName(item.date) === getDayName(date) && (
          new Date(item.date) > new Date(date)
        );
      });
      const reservationsWithOverlappingTime = reservationsOnSameDayInFuture.filter(overlappingHoursFilter);
      if (reservationsWithOverlappingTime.length) {
        const localDate = getLocalDate(reservationsWithOverlappingTime[0].date);
        throw new Error(getReservationError('overlapping', {courtNum: selectedCourtNum, localDate}));
      }
    }
  }
};
