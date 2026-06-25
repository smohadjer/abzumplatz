import { ObjectId, Collection } from 'mongodb';
import { sanitize } from './_lib.js';
import type { VercelRequest, VercelResponse } from './_apiTypes.js';
import { DBUser, ReservationItem } from '../../src/types.js';
import {
  getAllReservations,
  getNextActiveRecurringReservationDate,
  isInPast
} from '../../src/utils/utils.js';
import {
  validateReservationBody,
} from './_reservationValidation.js';
import {
  validateNonAdminReservationRules,
  validateReservationNotInPast,
  validateReservationWithinClubHours,
  validateReservationOverlap
} from './_reservationValidation.js';
import { createAppError, getAppErrorResponse } from './_errors.js';
import type { AppErrorCode } from './_errors.js';
import { getAuthenticatedUserContext } from './_authenticatedUser.js';

type ReservationClub = {
  start_hour: number;
  end_hour: number;
  reservations_limit: number;
}

type ValidatedEditRequest = {
  assignToMyself: boolean;
  courtNums: string[];
  recurring: boolean;
  startTime: number;
  endTime: number;
  updates: {
    date: string;
    label: string;
    court_nums: string[];
    start_time: number;
    end_time: number;
    recurring: boolean;
  };
};

const validateEditAccess = (
  reservation: ReservationItem,
  clubId: string,
  payloadUserId: string,
  userRole: string,
  occurrenceDate: string
) => {
  const passed = isInPast(new Date(reservation.date), reservation.start_time);
  const passedOccurrence = isInPast(new Date(occurrenceDate), reservation.start_time);

  if (reservation.club_id !== clubId) {
    return getAppErrorResponse('RESERVATION_EDIT_OWN_CLUB_ONLY');
  }

  if (passed && !reservation.recurring) {
    throw createAppError('RESERVATION_EDIT_PAST_NOT_ALLOWED');
  }

  if (reservation.user_id !== payloadUserId && userRole !== 'admin') {
    return getAppErrorResponse('RESERVATION_EDIT_OWN_OR_ADMIN_ONLY');
  }

  if (reservation.recurring && userRole !== 'admin') {
    return getAppErrorResponse('RESERVATION_EDIT_RECURRING_ADMIN_ONLY');
  }

  if (reservation.recurring && passedOccurrence) {
    throw createAppError('RESERVATION_EDIT_PAST_NOT_ALLOWED');
  }

  return null;
};

const validateEditRequest = (
  body: Record<string, unknown>,
  userRole: string,
  club: ReservationClub
): ValidatedEditRequest | { error: unknown } | { status: 403; body: { error: string } } => {
  const {
    reservation_id: _reservationId,
    assign_to_myself: assignToMyselfValue,
    date,
    start_time: startTimeValue,
    end_time: endTimeValue,
    label,
    court_nums,
    recurring: recurringValue
  } = body;

  const validatedBody = {
    date,
    label,
    court_nums,
    recurring: recurringValue,
    start_time: startTimeValue,
    end_time: endTimeValue
  };
  const validatedReservation = validateReservationBody(validatedBody);
  if ('errors' in validatedReservation) {
    return { error: validatedReservation.errors };
  }

  const assignToMyself = assignToMyselfValue === true || assignToMyselfValue === 'true';
  if (assignToMyself && userRole !== 'admin') {
    return getAppErrorResponse('RESERVATION_ASSIGN_ADMIN_ONLY');
  }

  const { body: normalizedBody, courtNums, startTime, endTime, recurring } = validatedReservation;
  const updates = {
    ...normalizedBody,
    court_nums: courtNums,
    start_time: startTime,
    end_time: endTime,
    recurring
  };

  if (!Object.keys(updates).length) {
    return { error: 'RESERVATION_EDIT_NO_FIELDS' as AppErrorCode };
  }

  if (userRole !== 'admin') {
    validateNonAdminReservationRules(courtNums, recurring, startTime, endTime);
  }

  validateReservationNotInPast(updates.date, startTime);
  validateReservationWithinClubHours(startTime, endTime, club.start_hour, club.end_hour);

  return {
    assignToMyself,
    courtNums,
    recurring,
    startTime,
    endTime,
    updates
  };
};

const getWeekday = (date: string) => new Date(date).getDay();

export const editReservation = async (
  req: VercelRequest,
  res: VercelResponse,
  reservations: Collection<ReservationItem>,
  clubs: Collection<ReservationClub>,
  users: Collection<DBUser>
) => {
  const body = sanitize(req.body);
  const occurrenceDate = typeof body?.occurrence_date === 'string' ? body.occurrence_date : undefined;
  const reservation_id = body?.reservation_id;
  if (!reservation_id || typeof reservation_id !== 'string') {
    const { status, body } = getAppErrorResponse('RESERVATION_ID_REQUIRED');
    return res.status(status).json(body);
  }

  const query = {
    _id: ObjectId.createFromHexString(reservation_id)
  };
  const reservation = await reservations.findOne(query);

  if (!reservation) {
    const { status, body } = getAppErrorResponse('RESERVATION_NOT_FOUND');
    return res.status(status).json(body);
  }

  const { payload, user } = await getAuthenticatedUserContext(req, users, {
    requireActive: true
  });

  const club_id = user.club_id;
  if (!club_id) {
    throw createAppError('USER_HAS_NO_CLUB');
  }

  const club = await clubs.findOne({
    _id: ObjectId.createFromHexString(club_id)
  });
  if (!club) {
    throw createAppError('CLUB_NOT_FOUND');
  }

  if (reservation.recurring && !occurrenceDate) {
    const { status, body } = getAppErrorResponse('RESERVATION_EDIT_OCCURRENCE_DATE_REQUIRED');
    return res.status(status).json(body);
  }

  if (reservation.recurring && occurrenceDate) {
    const accessError = validateEditAccess(reservation, club_id, payload._id, user.role, occurrenceDate);
    if (accessError) {
      return res.status(accessError.status).json(accessError.body);
    }
  }

  const editFromReservationDate = reservation.recurring
    ? getNextActiveRecurringReservationDate(reservation)
    : reservation.date;
  if (reservation.recurring && !editFromReservationDate) {
    throw createAppError('RESERVATION_EDIT_PAST_NOT_ALLOWED');
  }
  if (!reservation.recurring) {
    const accessError = validateEditAccess(reservation, club_id, payload._id, user.role, editFromReservationDate);
    if (accessError) {
      return res.status(accessError.status).json(accessError.body);
    }
  }

  const validatedRequest = validateEditRequest(body, user.role, club);
  if ('status' in validatedRequest) {
    return res.status(validatedRequest.status).json(validatedRequest.body);
  }
  if ('error' in validatedRequest) {
    if (typeof validatedRequest.error === 'string') {
      const { status, body } = getAppErrorResponse(validatedRequest.error as AppErrorCode);
      return res.status(status).json(body);
    }
    return res.status(200).json({error: validatedRequest.error});
  }

  const {
    assignToMyself,
    courtNums,
    recurring,
    startTime,
    endTime,
    updates
  } = validatedRequest;

  if (reservation.recurring && editFromReservationDate > reservation.date) {
    const normalizedRecurringStartDate =
      updates.date > editFromReservationDate &&
      getWeekday(updates.date) === getWeekday(reservation.date)
        ? editFromReservationDate
        : updates.date;

    if (normalizedRecurringStartDate < editFromReservationDate) {
      throw createAppError('RESERVATION_EDIT_START_BEFORE_SELECTED');
    }

    await validateReservationOverlap(
      reservations,
      club_id,
      courtNums,
      normalizedRecurringStartDate,
      startTime,
      endTime,
      recurring,
      query._id
    );

    await reservations.updateOne(query, {
      '$set': {
        end_date: editFromReservationDate
      }
    });

    await reservations.insertOne({
      club_id,
      user_id: assignToMyself ? payload._id : reservation.user_id,
      court_nums: courtNums,
      date: normalizedRecurringStartDate,
      start_time: startTime,
      end_time: endTime,
      label: updates.label,
      recurring,
      timestamp: new Date()
    });

    const docs = await getAllReservations(reservations, club_id);
    return res.status(200).json({
      message: `Reservation with id ${reservation_id} was edited.`,
      data: docs
    });
  }

  await validateReservationOverlap(reservations, club_id, courtNums, updates.date, startTime, endTime, recurring, query._id);

  if (assignToMyself) {
    updates.user_id = payload._id;
  }

  await reservations.updateOne(query, {
    '$set': updates
  });

  const docs = await getAllReservations(reservations, club_id);
  return res.status(200).json({
    message: `Reservation with id ${reservation_id} was edited.`,
    data: docs
  });
};
