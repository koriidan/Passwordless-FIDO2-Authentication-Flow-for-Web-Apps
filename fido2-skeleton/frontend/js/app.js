
import {
    startAuthentication,
    browserSupportsWebAuthn
} from "@simplewebauthn/browser";

import {
    getLoginOptions,
    verifyLogin
} from "./api.js";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const message = document.getElementById("message");

const passkeyButton = loginForm.querySelector(
    'button[type="submit"]'
);

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b91c1c" : "#15803d";
}

function getUsername() {
    const username = usernameInput.value.trim();

    if (!username) {
        showMessage("Please enter your username.", true);
        usernameInput.focus();
        return null;
    }

    return username;
}

// Check whether the browser supports WebAuthn
if (!browserSupportsWebAuthn()) {
    showMessage(
        "Your browser does not support passkeys.",
        true
    );
    passkeyButton.disabled = true;
}

// Passkey login
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = getUsername();
    if (!username) return;

    passkeyButton.disabled = true;

    try {
        showMessage("Requesting authentication challenge...");

        // Step 1: Get challenge from backend
        const optionsJSON = await getLoginOptions(username);

        // Step 2: Authenticate with passkey
        showMessage("Follow the browser's passkey prompt.");

        const assertionResponse = await startAuthentication({
            optionsJSON
        });

        // Step 3: Verify with backend
        showMessage("Verifying your identity...");

        const result = await verifyLogin(
            username,
            assertionResponse
        );

        if (result.verified === true) {
            showMessage("Login successful!");

            // Redirect only after backend verification
            window.location.href = "dashboard.html";
        } else {
            showMessage("Authentication failed.", true);
        }

    } catch (error) {
        console.error("Passkey login error:", error);

        if (error.name === "NotAllowedError") {
            showMessage(
                "Authentication canceled or timed out.",
                true
            );
        } else {
            showMessage(error.message, true);
        }

    } finally {
        passkeyButton.disabled = false;
    }
});

// Push login placeholder
document.getElementById("pushLogin")
    .addEventListener("click", function() {
        const username = getUsername();
        if (!username) return;

        showMessage(
            `Push authentication for ${username} is coming next.`
        );
    });

// TOTP login placeholder
document.getElementById("totpLogin")
    .addEventListener("click", function() {
        const username = getUsername();
        if (!username) return;

        showMessage(
            `Authenticator code login for ${username} is coming next.`
        );
    });
