import { verifyCode, getSession } from "./api.js";

const totpForm = document.getElementById("totpForm");
const usernameInput = document.getElementById("totpUsername");
const codeInput = document.getElementById("totpCode");
const verifyButton = document.getElementById("verifyTotp");
const message = document.getElementById("message");

// Display messages to the user.
function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b91c1c" : "#15803d";
}

// Handle authentication code submission.
totpForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const code = codeInput.value.trim();

    // Validate the username.
    if (!username) {
        showMessage("Please enter your username.", true);
        usernameInput.focus();
        return;
    }

    // Require exactly six digits.
    if (!/^\d{6}$/.test(code)) {
        showMessage("Please enter a valid 6-digit code.", true);
        codeInput.focus();
        return;
    }

    verifyButton.disabled = true;

    try {
        showMessage("Verifying authentication code...");

        // STEP 1: Send code to backend.
        const result = await verifyCode(username, code);

        console.log("TOTP verification response:", result);

        // STEP 2: Only proceed after successful verification.
        if (result.verified !== true) {
            showMessage("Invalid or expired authentication code.", true);
            return;
        }

        // STEP 3: Verify that the backend established a session.
        try {
            const session = await getSession();

            if (session && session.username === username) {
                showMessage("Authentication successful!");
                window.location.replace("dashboard.html");
            } else {
                showMessage(
                    "Code accepted, but the login session was not established.",
                    true
                );
            }
        } catch (error) {
            console.error("Session verification failed:", error);
            showMessage(
                "Code accepted, but the backend did not establish a session.",
                true
            );
        }

    } catch (error) {
        console.error("TOTP authentication failed:", error);
        showMessage(error.message, true);

    } finally {
        verifyButton.disabled = false;
    }
});
