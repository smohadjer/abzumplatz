type ErrorWithCause = Error & {
    cause?: unknown;
}

import { getInactiveUserMessage } from '../../src/messages.js';

export type AppErrorCode =
    | 'AUTHENTICATION_REQUIRED'
    | 'USER_NOT_FOUND'
    | 'USER_INACTIVE'
    | 'USER_HAS_NO_CLUB'
    | 'CLUB_NOT_FOUND'
    | 'RESERVATION_ID_REQUIRED'
    | 'RESERVATION_NOT_FOUND'
    | 'RESERVATION_EDIT_OWN_CLUB_ONLY'
    | 'RESERVATION_EDIT_OWN_OR_ADMIN_ONLY'
    | 'RESERVATION_EDIT_RECURRING_ADMIN_ONLY'
    | 'RESERVATION_ASSIGN_ADMIN_ONLY'
    | 'RESERVATION_EDIT_NO_FIELDS'
    | 'RESERVATION_EDIT_OCCURRENCE_DATE_REQUIRED'
    | 'RESERVATION_EDIT_PAST_NOT_ALLOWED'
    | 'RESERVATION_EDIT_START_BEFORE_SELECTED'
    | 'RESERVATION_DELETE_OWN_OR_ADMIN_ONLY'
    | 'RESERVATION_DELETE_OWN_CLUB_ONLY'
    | 'RESERVATION_DELETE_PAST_NOT_ALLOWED'
    | 'RESERVATION_DELETE_FAILED';

type AppErrorDefinition = {
    message: string;
    status: number;
};

const APP_ERRORS: Record<AppErrorCode, AppErrorDefinition> = {
    AUTHENTICATION_REQUIRED: {
        message: 'Authentifizierung erforderlich',
        status: 401
    },
    USER_NOT_FOUND: {
        message: 'Benutzer nicht gefunden',
        status: 404
    },
    USER_INACTIVE: {
        message: getInactiveUserMessage(),
        status: 403
    },
    USER_HAS_NO_CLUB: {
        message: 'Der Benutzer gehört keinem Verein an',
        status: 500
    },
    CLUB_NOT_FOUND: {
        message: 'Verein nicht gefunden',
        status: 404
    },
    RESERVATION_ID_REQUIRED: {
        message: 'Die Reservierungs-ID ist erforderlich',
        status: 400
    },
    RESERVATION_NOT_FOUND: {
        message: 'Reservierung nicht gefunden',
        status: 404
    },
    RESERVATION_EDIT_OWN_CLUB_ONLY: {
        message: 'Sie können nur Reservierungen in Ihrem eigenen Verein bearbeiten',
        status: 403
    },
    RESERVATION_EDIT_OWN_OR_ADMIN_ONLY: {
        message: 'Sie können nur Ihre eigenen Reservierungen bearbeiten, es sei denn, Sie sind Administrator',
        status: 403
    },
    RESERVATION_EDIT_RECURRING_ADMIN_ONLY: {
        message: 'Wiederkehrende Reservierungen können nur von Administratoren bearbeitet werden',
        status: 403
    },
    RESERVATION_ASSIGN_ADMIN_ONLY: {
        message: 'Nur Administratoren können sich Reservierungen zuweisen',
        status: 403
    },
    RESERVATION_EDIT_NO_FIELDS: {
        message: 'Es wurden keine Reservierungsfelder zum Aktualisieren übermittelt',
        status: 400
    },
    RESERVATION_EDIT_OCCURRENCE_DATE_REQUIRED: {
        message: 'occurrence_date ist für die Bearbeitung wiederkehrender Reservierungen erforderlich',
        status: 400
    },
    RESERVATION_EDIT_PAST_NOT_ALLOWED: {
        message: 'Vergangene Reservierungen können nicht bearbeitet werden',
        status: 400
    },
    RESERVATION_EDIT_START_BEFORE_SELECTED: {
        message: 'Das Startdatum der bearbeiteten Reservierung darf nicht vor dem ausgewählten Termin liegen',
        status: 400
    },
    RESERVATION_DELETE_OWN_OR_ADMIN_ONLY: {
        message: 'Sie können nur Ihre eigenen Reservierungen löschen, es sei denn, Sie sind Administrator',
        status: 403
    },
    RESERVATION_DELETE_OWN_CLUB_ONLY: {
        message: 'Sie können nur Reservierungen in Ihrem eigenen Verein löschen',
        status: 403
    },
    RESERVATION_DELETE_PAST_NOT_ALLOWED: {
        message: 'Vergangene Reservierungen können nicht gelöscht werden',
        status: 400
    },
    RESERVATION_DELETE_FAILED: {
        message: 'Löschen fehlgeschlagen!',
        status: 500
    }
};

export class AppError extends Error {
    code: AppErrorCode;
    statusCode: number;
    cause?: unknown;

    constructor(code: AppErrorCode, cause?: unknown) {
        super(APP_ERRORS[code].message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = APP_ERRORS[code].status;
        this.cause = cause;
    }
}

export function createError(message: string, cause?: unknown) {
    const error = new Error(message) as ErrorWithCause;
    error.cause = cause;
    return error;
}

export function createAppError(code: AppErrorCode, cause?: unknown) {
    return new AppError(code, cause);
}

export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

export function getAppErrorResponse(code: AppErrorCode) {
    const definition = APP_ERRORS[code];
    return {
        status: definition.status,
        body: {
            code,
            error: definition.message
        }
    };
}

export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

export function getErrorCause(error: unknown) {
    return error instanceof Error ? (error as ErrorWithCause).cause : undefined;
}
