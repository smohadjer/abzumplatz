import Ajv from 'ajv';

type Sanitizable =
    | string
    | number
    | boolean
    | null
    | undefined
    | Sanitizable[]
    | { [key: string]: Sanitizable };

const shouldPreserveWhitespace = (keyPath: string[]) => {
    const fieldName = keyPath[keyPath.length - 1];
    return fieldName === 'password';
};

function sanitizeValue(value: Sanitizable, keyPath: string[] = []): Sanitizable {
    if (typeof value === 'string') {
        if (shouldPreserveWhitespace(keyPath)) {
            return value.length ? value : undefined;
        }

        const trimmedValue = value.trim();
        return trimmedValue.length ? trimmedValue : undefined;
    }

    if (Array.isArray(value)) {
        return value
            .map((item, index) => sanitizeValue(item, [...keyPath, index.toString()]))
            .filter((item) => item !== undefined);
    }

    if (value && typeof value === 'object') {
        const temp: { [key: string]: Sanitizable } = {};

        for (const [key, item] of Object.entries(value)) {
            const sanitizedItem = sanitizeValue(item as Sanitizable, [...keyPath, key]);

            if (sanitizedItem !== undefined) {
                temp[key] = sanitizedItem;
            }
        }

        return temp;
    }

    return value;
}

export function sanitize<T extends Sanitizable>(data: T): T {
    return sanitizeValue(data) as T;
}

export const ajv = new Ajv({
    coerceTypes: true,
    allErrors: true, // when set to true all errors for a property are returned instead of just the first error
    strict: false, // by setting strict to false we can add custom properties such as "errorMessage" to schema
    verbose: true // adds additional propertie sto error object that we use for custom error messages
});

export function getCustomErrorMessage(error: any) {
    const customErrorMessage = error.parentSchema?.errorMessage;

    if (typeof customErrorMessage === 'string') {
        return customErrorMessage;
    }

    if (customErrorMessage && typeof customErrorMessage === 'object') {
        return customErrorMessage[error.keyword];
    }
}

export function escapeHtml(value: unknown) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
