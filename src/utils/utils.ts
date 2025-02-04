// Deep cloning arrays and objects with support for older browsers
export const deepClone = (item: {} | []) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(item);
    } else {
        return JSON.parse(JSON.stringify(item));
    }
}

export const isAuthenticated = async () => {
    const response = await fetch('/api/verifyAuth');
    const isAuthenticated = await response.json();
    return isAuthenticated;
}
