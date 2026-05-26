export function getCurrentUser() {
    const token = sessionStorage.getItem('token');
    if (!token) return null;

    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = atob(payloadBase64);
        return JSON.parse(decodedPayload);
    } catch (error) {
        return null;
    }
}
