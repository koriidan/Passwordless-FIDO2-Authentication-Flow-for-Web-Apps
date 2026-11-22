import { initiatePush, getPushStatus, getSession } from "./api.js";

const usernameInput = document.getElementById("pushUsername");
const startButton = document.getElementById("startPush");
const pushSection = document.getElementById("pushSection");
const pushNumber = document.getElementById("pushNumber");
const pushStatus = document.getElementById("pushStatus");
const cancelButton = document.getElementById("cancelPush");
const message = document.getElementById("message");

let activeRequestId = null;
let pollTimer = null;
let polling = false;

// Stop checking the backend.
function stopPolling() {
    if (pollTimer !== null) {
        clearTimeout(pollTimer);
        pollTimer = null;
    }
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b91c1c" : "#15803d";
}


async function checkPushStatus(requestId) {
    if (polling || activeRequestId !== requestId) {
        return;
    }

    polling = true;

    try {
        const result = await getPushStatus(requestId);

        // Ignore old responses if the user stopped waiting.
        if (activeRequestId !== requestId) return;

        console.log("Push status:", result);

        const status = result.status;

        if (status === "approved") {
            stopPolling();

            pushStatus.textContent = "Push request approved!";

            // Approval alone does not establish a session.
            try {
                const session = await getSession();

                if (session && session.username) {
                    window.location.replace("dashboard.html");
                    return;
                }
            } catch (error) {
                console.error("Session not established:", error);
            }

            pushStatus.textContent =
                "Approved, but login is not complete. " +
                "The backend must create a valid session.";

            activeRequestId = null;
            startButton.disabled = false;
            return;
        }

        if (status === "denied") {
            stopPolling();
            pushStatus.textContent = "Push request denied.";
            showMessage("Authentication was denied.", true);
            activeRequestId = null;
            startButton.disabled = false;
            return;
        }

        if (status === "expired") {
            stopPolling();
            pushStatus.textContent = "Push request expired.";
            showMessage("Please start a new request.", true);
            activeRequestId = null;
            startButton.disabled = false;
            return;
        }

        if (status !== "pending") {
            stopPolling();
            showMessage("Unknown push status received.", true);
            activeRequestId = null;
            startButton.disabled = false;
            return;
        }

        pushStatus.textContent =
            "Waiting for approval on your trusted device...";

    } catch (error) {
        if (activeRequestId !== requestId) return;

        console.error("Push status check failed:", error);
        stopPolling();
        showMessage(error.message, true);
        pushStatus.textContent = "Unable to check request status.";
        activeRequestId = null;
        startButton.disabled = false;
        return;

    } finally {
        polling = false;

        // Schedule another check only for active requests.
        if (activeRequestId === requestId && pollTimer === null) {
            pollTimer = setTimeout(() => {
                pollTimer = null;
                checkPushStatus(requestId);
            }, 3000);
        }
    }
}


startButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (!username) {
        showMessage("Please enter your username.", true);
        usernameInput.focus();
        return;
    }

    startButton.disabled = true;

    try {
        showMessage("Sending push authentication request...");

        const result = await initiatePush(username);

        console.log("Push response:", result);

        activeRequestId = result.requestId;

        pushNumber.textContent = result.correctNumber ?? "--";
        pushSection.hidden = false;

        pushStatus.textContent =
            "Waiting for approval on your trusted device...";

        showMessage("Push request sent successfully.");
        stopPolling();
        checkPushStatus(activeRequestId);

    } catch (error) {
        console.error("Push authentication failed:", error);
        showMessage(error.message, true);
        startButton.disabled = false;
    }
});

// Stop waiting locally.
// This does not revoke a backend request.
cancelButton.addEventListener("click", () => {
    stopPolling();

    activeRequestId = null;
    pushSection.hidden = true;
    pushNumber.textContent = "--";

    startButton.disabled = false;

    showMessage("Stopped waiting for push authentication.");
});
