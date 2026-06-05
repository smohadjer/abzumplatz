type ErrorWithCause = Error & {
    cause?: unknown;
}

export function createError(message: string, cause?: unknown) {
    const error = new Error(message) as ErrorWithCause;
    error.cause = cause;
    return error;
}

export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

export function getErrorCause(error: unknown) {
    return error instanceof Error ? (error as ErrorWithCause).cause : undefined;
}
