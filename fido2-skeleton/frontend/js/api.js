
const API_BASE = "http://localhost:3000";

export async function apiRequest(endpoint, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE}${endpoint}`, {
            method: options.method || "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            },
            ...options
        });
    } catch {
        throw new Error(
            "Cannot connect to the backend. " +
            "Check that the backend server is running."
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || `Request failed: ${response.status}`
        );
    }

    return data;
}

export function getRegistrationOptions(username, displayName) {
    return apiRequest("/register/options", {
        method: "POST",
        body: JSON.stringify({
            username,
            displayName
        })
    });
}

export function verifyRegistration(username, attestationResponse) {
    return apiRequest("/register/verify", {
        method: "POST",
        body: JSON.stringify({
            username,
            attestationResponse
        })
    });
}

export function getLoginOptions(username) {
    return apiRequest("/login/options", {
        method: "POST",
        body: JSON.stringify({ username })
    });
}

export function verifyLogin(username, assertionResponse) {
    return apiRequest("/login/verify", {
        method: "POST",
        body: JSON.stringify({
            username,
            assertionResponse
        })
    });
}