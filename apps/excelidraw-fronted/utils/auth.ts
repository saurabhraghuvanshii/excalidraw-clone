export function isAuthenticated() {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        // Basic validation - in production, you might want server-side validation
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
            return payload.exp * 1000 > Date.now();
        }
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export function clearAuth() {
    localStorage.removeItem('token');
}

export function getToken() {
    return localStorage.getItem('token');
}
