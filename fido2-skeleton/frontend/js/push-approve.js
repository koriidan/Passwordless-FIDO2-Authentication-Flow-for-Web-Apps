
import {
    getSession,
    getPendingPushRequests,
    respondToPush
} from "./api.js";

const approvalSection = document.getElementById("approvalSection");
const numberOptions = document.getElementById("numberOptions");
const approveButton = document.getElementById("approveButton");
const denyButton = document.getElementById("denyButton");
const approvalMessage = document.getElementById("approvalMessage");

let currentRequest = null;
let selectedNumber = null;

function showMessage(text, isError = false) {
    approvalMessage.textContent = text;
    approvalMessage.style.color =
        isError ? "#b91c1c" : "#15803d";
}

// Load pending requests for the authenticated user.
async function loadPendingRequests() {
    approvalSection.hidden = true;
    approveButton.disabled = true;
    selectedNumber = null;
    currentRequest = null;

    try {
        const data = await getPendingPushRequests();
        const requests = data.requests || [];

        if (requests.length === 0) {
            showMessage("No pending sign-in requests.");
            return;
        }

        // Display the newest pending request for now.
        currentRequest = requests[requests.length - 1];

        // The backend must provide the number choices.
        const choices = currentRequest.choices;

        if (!Array.isArray(choices) || choices.length === 0) {
            showMessage(
                "Number choices are unavailable. " +
                "The backend must provide them.",
                true
            );
            return;
        }

        numberOptions.replaceChildren();

        choices.forEach((number) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "number-option";
            button.textContent = number;

            button.addEventListener("click", () => {
                selectedNumber = number;

                document.querySelectorAll(".number-option")
                    .forEach((option) => {
                        option.classList.remove("selected");
                    });

                button.classList.add("selected");
                approveButton.disabled = false;
            });

            numberOptions.appendChild(button);
        });

        approvalSection.hidden = false;
        showMessage("Select the matching number to approve.");

    } catch (error) {
        console.error("Failed to load pending requests:", error);
        showMessage(error.message, true);
    }
}

// Approve the selected request.
approveButton.addEventListener("click", async () => {
    if (!currentRequest || selectedNumber === null) {
        return;
    }

    approveButton.disabled = true;
    denyButton.disabled = true;

    try {
        await respondToPush(
            currentRequest.requestId,
            selectedNumber,
            true
        );

        approvalSection.hidden = true;
        showMessage("Approval response submitted.");

    } catch (error) {
        console.error("Push approval failed:", error);
        showMessage(error.message, true);
        approveButton.disabled = false;
        denyButton.disabled = false;
    }
});

// Deny the request.
denyButton.addEventListener("click", async () => {
    if (!currentRequest) return;

    approveButton.disabled = true;
    denyButton.disabled = true;

    try {
        await respondToPush(
            currentRequest.requestId,
            null,
            false
        );

        approvalSection.hidden = true;
        showMessage("Request denied.");

    } catch (error) {
        console.error("Push denial failed:", error);
        showMessage(error.message, true);
        approveButton.disabled = selectedNumber === null;
        denyButton.disabled = false;
    }
});

// Verify the approver is already authenticated.

let refreshTimer = null;
let refreshing = false;

async function initializeApprovalPage() {
    try {
        // Confirm the approving device has a valid session.
        await getSession();

        // Load pending requests immediately.
        await refreshPendingRequests();

        // Automatically check again every 3 seconds.
        refreshTimer = setInterval(() => {
            if (!document.hidden && !refreshing) {
                refreshPendingRequests();
            }
        }, 3000);

    } catch (error) {
        console.error("Approval session check failed:", error);
        approvalSection.hidden = true;

        showMessage(
            "You must sign in on this trusted device first.",
            true
        );
    }
}

async function refreshPendingRequests() {
    if (refreshing) return;
    refreshing = true;

    try {
        // Don't reset the selected number every time
        // unless the current request has changed.
        const data = await getPendingPushRequests();
        const requests = data.requests || [];

        if (requests.length === 0) {
            currentRequest = null;
            selectedNumber = null;
            approvalSection.hidden = true;
            showMessage("No pending sign-in requests.");
            return;
        }

        const newestRequest = requests[requests.length - 1];

        // Only redraw when the request changes.
        if (currentRequest?.requestId !== newestRequest.requestId) {
            await loadPendingRequests();
        }

    } catch (error) {
        console.error("Unable to refresh requests:", error);
        showMessage(error.message, true);
    } finally {
        refreshing = false;
    }
}

window.addEventListener("beforeunload", () => {
    if (refreshTimer !== null) {
        clearInterval(refreshTimer);
    }
});


initializeApprovalPage();
