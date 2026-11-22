
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

export function getSession() {
    return apiRequest("/session");
}

export function logout() {
    return apiRequest("/logout", {
        method: "POST"
    });
}

export function getAudit() {
    return apiRequest("/audit");
}

export function verifyCode(username, code) {
    return apiRequest("/code/verify", {
        method: "POST",
        body: JSON.stringify({
            username,
            code
        })
    });
}

// Start a push authentication request.
export function initiatePush(username) {
    return apiRequest("/push/initiate", {
        method: "POST",
        body: JSON.stringify({ username })
    });
}

// Check the status of a push authentication request.
export function getPushStatus(requestId) {
    return apiRequest(
        `/push/status/${encodeURIComponent(requestId)}`
    );
}

/**
 * Retrieve pending push authentication requests.
 * The backend must identify the authenticated user
 * from their session, not from a supplied username.
 */
export function getPendingPushRequests() {
    return apiRequest("/push/pending");
}

/**
 * Submit an approval or denial for a push request.
 *
 * requestId: ID of the pending request
 * selectedNumber: number chosen by the user
 * approved: whether the user approved the request
 */

export function respondToPush(
    requestId,
    selectedNumber,
    approved
) {
    return apiRequest("/push/respond", {
        method: "POST",
        body: JSON.stringify({
            requestId: requestId,
            chosenNumber: selectedNumber,
            approve: approved
        })
    });
}
