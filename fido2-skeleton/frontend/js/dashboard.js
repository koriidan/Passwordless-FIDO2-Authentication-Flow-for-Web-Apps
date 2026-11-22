
import { getSession, logout, getAudit, apiRequest } from "./api.js";

const userName = document.getElementById("username");
const method = document.getElementById("method");
const logoutButton = document.getElementById("logoutButton");
const auditRows = document.getElementById("auditRows");
const auditMessage = document.getElementById("auditMessage");
const deviceList = document.getElementById("deviceList");
const deviceMessage = document.getElementById("deviceMessage");

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
            item.textContent = `Passkey ${index + 1}`;
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
        loadAudit()
    ]);
}

initializeDashboard();
