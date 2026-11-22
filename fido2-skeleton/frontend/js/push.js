import { initiatePush } from "./api.js";

const usernameInput = document.getElementById("pushUsername");
const startButton = document.getElementById("startPush");
const pushSection = document.getElementById("pushSection");
const pushNumber = document.getElementById("pushNumber");
const pushStatus = document.getElementById("pushStatus");
const cancelButton = document.getElementById("cancelPush");
const message = document.getElementById("message");

let activeRequestId = null;

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b91c1c" : "#15803d";
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

        pushNumber.textContent = result.number ?? "--";
        pushSection.hidden = false;

        pushStatus.textContent =
            "Waiting for approval on your trusted device...";

        showMessage("Push request sent successfully.");

    } catch (error) {
        console.error("Push authentication failed:", error);
        showMessage(error.message, true);
        startButton.disabled = false;
    }
});

// Stop waiting locally.
// This does not revoke a backend request.
cancelButton.addEventListener("click", () => {
    activeRequestId = null;
    pushSection.hidden = true;
    pushNumber.textContent = "--";
    startButton.disabled = false;

    showMessage("Stopped waiting for push authentication.");
});
