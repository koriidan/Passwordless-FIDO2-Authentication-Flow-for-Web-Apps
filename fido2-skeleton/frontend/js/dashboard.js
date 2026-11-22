
import { getSession, logout, getAudit, apiRequest } from "./api.js";
import QRCode from "qrcode";

const userName = document.getElementById("username");
const method = document.getElementById("method");
const logoutButton = document.getElementById("logoutButton");
const auditRows = document.getElementById("auditRows");
const auditMessage = document.getElementById("auditMessage");
const deviceList = document.getElementById("deviceList");
const deviceMessage = document.getElementById("deviceMessage");
const setupTotpButton = document.getElementById("setupTotpButton");
const totpSetupArea = document.getElementById("totpSetupArea");
const totpSetupLink = document.getElementById("totpSetupLink");
const totpSetupMessage = document.getElementById("totpSetupMessage");
const totpConfirmCode = document.getElementById("totpConfirmCode");
const confirmTotpButton = document.getElementById("confirmTotpButton");
const totpManualKey = document.getElementById("totpManualKey");
const totpQrCode = document.getElementById("totpQrCode");

// STEP 1: Check whether the user is logged in.
async function checkSession() {
    try {
        const session = await getSession();

        userName.textContent = session.username;
        method.textContent = session.method;

        return true;
    } catch (error) {
        console.error("Session check failed:", error);
        window.location.replace("index.html");
        return false;
    }
}

// STEP 2: Load registered passkeys.
// Check whether an authenticator app is already enrolled.
async function checkTotpStatus() {
    try {
        const data = await apiRequest("/code/status");

        if (data.totpEnabled) {
            setupTotpButton.hidden = true;
            totpSetupMessage.textContent =
                "Authenticator app already configured.";
        } else {
            setupTotpButton.hidden = false;
            totpSetupMessage.textContent = "";
        }

    } catch (error) {
        console.error("TOTP status check failed:", error);
        setupTotpButton.hidden = true;
        totpSetupMessage.textContent =
            "Could not check authenticator setup status.";
    }
}

async function loadDevices() {
    deviceList.replaceChildren();
    deviceMessage.textContent = "";

    try {
        const data = await apiRequest("/devices");

        if (!data.devices || data.devices.length === 0) {
            const item = document.createElement("li");
            item.textContent = "No registered passkeys.";
            deviceList.appendChild(item);
            return;
        }

        data.devices.forEach(function(device, index) {
            const item = document.createElement("li");
            const label = document.createElement("span");
            label.textContent = `Passkey ${index + 1} `;

            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.type = "button";
            removeButton.className = "remove-btn";

            removeButton.addEventListener("click", async function() {
            const confirmed = confirm(
                "Are you sure you want to remove this passkey?"
            );

        if (!confirmed) return;

        // Prevent accidental double-clicks.
        removeButton.disabled = true;

        try {
            await apiRequest(
                `/devices/${encodeURIComponent(device.credentialId)}`,
                { method: "DELETE" }
            );

            deviceMessage.textContent =
                "Passkey removed successfully.";

            await loadDevices();

        } catch (error) {
            console.error("Remove passkey failed:", error);
            deviceMessage.textContent = error.message;
            removeButton.disabled = false;
        }
    });

    item.appendChild(label);
    item.appendChild(removeButton);
    deviceList.appendChild(item);
});

    } catch (error) {
        console.error("Device loading failed:", error);
        deviceMessage.textContent =
            "Could not load registered passkeys.";
    }
}

// STEP 3: Load recent login activity.
async function loadAudit() {
    auditRows.replaceChildren();
    auditMessage.textContent = "";

    try {
        const data = await getAudit();

        if (!data.attempts || data.attempts.length === 0) {
            auditMessage.textContent = "No sign-in attempts yet.";
            return;
        }

        data.attempts.forEach(function(attempt) {
            const row = document.createElement("tr");

            const date = new Date(attempt.at);
            const dateText = Number.isNaN(date.getTime())
                ? "Unknown date"
                : date.toLocaleString();

            const cells = [
                dateText,
                attempt.method || "Unknown",
                attempt.outcome || "Unknown"
            ];

            cells.forEach(function(value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            auditRows.appendChild(row);
        });

    } catch (error) {
        console.error("Audit load failed:", error);
        auditMessage.textContent =
            "Sign-in history not available.";
    }
}

// TOTP SETUP: Start authenticator enrollment.
setupTotpButton.addEventListener("click", async function() {
    setupTotpButton.disabled = true;
    totpSetupMessage.textContent = "";

    try {
        const data = await apiRequest("/code/enroll", {
            method: "POST"
        });

        if (!data.otpauthURI) {
            throw new Error("Authenticator setup link was not returned.");
        }


        if (!data.manualKey) {
            throw new Error("Manual setup key was not returned.");
        }

        totpSetupLink.href = data.otpauthURI;
        totpManualKey.textContent = data.manualKey;
        // Generate the authenticator QR code.
        await QRCode.toCanvas(totpQrCode, data.otpauthURI, {
            width: 220,
            margin: 2,
            errorCorrectionLevel: "M"
        });
        totpSetupArea.hidden = false;


        totpSetupMessage.textContent =
            "Scan the QR code or enter the manual setup key, then enter your 6-digit code.";

    } catch (error) {
        console.error("TOTP enrollment failed:", error);
        totpSetupMessage.textContent = error.message;
        setupTotpButton.disabled = false;
    }
});

 // TOTP SETUP: Confirm authenticator enrollment.
confirmTotpButton.addEventListener("click", async function() {
    const code = totpConfirmCode.value.trim();

    if (!/^\d{6}$/.test(code)) {
        totpSetupMessage.textContent =
            "Please enter a valid 6-digit code.";
        return;
    }

    confirmTotpButton.disabled = true;
    totpSetupMessage.textContent = "";

    try {
        const data = await apiRequest("/code/enroll/confirm", {
            method: "POST",
            body: JSON.stringify({ code })
        });

        if (!data.enrolled) {
            throw new Error("Authenticator setup was not confirmed.");
        }

        totpSetupArea.hidden = true;
        totpManualKey.textContent = "";
        totpConfirmCode.value = "";
        totpSetupLink.removeAttribute("href");
        totpQrCode.getContext("2d").clearRect(
            0, 0, totpQrCode.width, totpQrCode.height
        );
        setupTotpButton.hidden = true;

        totpSetupMessage.textContent =
            "Authenticator app successfully enrolled! You can now use it to sign in.";

    } catch (error) {
        console.error("TOTP confirmation failed:", error);
        totpSetupMessage.textContent = error.message;
    } finally {
        confirmTotpButton.disabled = false;
    }
});

// STEP 4: Log out.
logoutButton.addEventListener("click", async function() {
    logoutButton.disabled = true;

    try {
        await logout();
        window.location.replace("index.html");
    } catch (error) {
        console.error("Logout failed:", error);
        auditMessage.textContent =
            "Logout failed. Please try again.";
        logoutButton.disabled = false;
    }
});

// STEP 5: Initialize dashboard.
async function initializeDashboard() {
    const authenticated = await checkSession();

    if (!authenticated) {
        return;
    }

    await Promise.all([
        loadDevices(),
        loadAudit(),
        checkTotpStatus()
    ]);
}

initializeDashboard();
