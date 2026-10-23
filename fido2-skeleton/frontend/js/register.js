import {
    startRegistration,
    browserSupportsWebAuthn
} from "@simplewebauthn/browser";

import {
    getRegistrationOptions,
    verifyRegistration
} from "./api.js";

const registerForm = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const displayNameInput = document.getElementById("displayName");
const message = document.getElementById("message");
const registerButton = registerForm.querySelector(
    'button[type="submit"]'
);

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b91c1c" : "#15803d";
}

if (!browserSupportsWebAuthn()) {
    showMessage(
        "This browser does not support WebAuthn.",
        true
    );
    registerButton.disabled = true;
}

registerForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const displayName = displayNameInput.value.trim();

    if (!username || !displayName) {
        showMessage("Please fill out all fields.", true);
        return;
    }

    registerButton.disabled = true;
    showMessage("Requesting passkey registration...");

    try {
        // 1. Ask backend for registration challenge
        const optionsJSON = await getRegistrationOptions(
            username,
            displayName
        );

        // 2. Ask browser to create a passkey
        showMessage("Follow the passkey prompt in your browser.");

        const attestationResponse = await startRegistration({
            optionsJSON
        });

        // 3. Send credential back to backend
        showMessage("Verifying your passkey...");

        const result = await verifyRegistration(
            username,
            attestationResponse
        );

        if (result.verified === true) {
            showMessage(
                "Passkey verified by the server! " +
                "Credential storage must also be confirmed."
            );
        } else {
            showMessage(
                "Passkey verification was unsuccessful.",
                true
            );
        }

    } catch (error) {
        console.error("Registration error:", error);

        if (error.name === "NotAllowedError") {
            showMessage(
                "Passkey registration was canceled or timed out.",
                true
            );
        } else {
            showMessage(error.message, true);
        }
    } finally {
        registerButton.disabled = false;
    }
});
