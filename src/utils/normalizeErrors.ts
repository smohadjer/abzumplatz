import { FieldError, ServerError } from '../types';

export function normalizeErrors(errors: ServerError[]) : FieldError[] {
    console.log(errors)
    return errors.map(error => {
        if (error.instancePath.length > 0) {
            return {
                id: error.instancePath.substring(1),
                error: error.message
            }
        } else {
            return {
                id: error.params.missingProperty,
                error: error.message
            }
        }
    });
}
