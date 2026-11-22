import {getSession, logout, getAudit} from "./api.js";

const userName = document.getElementById("username");
const method = document.getElementById("method");
const logoutButton = document.getElementById("logoutButton");
const auditRows = document.getElementById("auditRows");
const auditMessage = document.getElementById("auditMessage");

async function checkSession()
{
    try
    {

        const session = await getSession();
        userName.textContent = session.username;
        method.textContent = session.method;
    }catch(error)
    {
        console.error("Session check failed", error);
        window.location.href = "index.html"
    }
}

async function loadAudit()
{
    auditRows.innerHTML = "";
    auditMessage.textContent = "";

    let data;

    try {
        data = await getAudit();
    } catch (error) 
    {
        console.error("audit load failed", error);
        auditMessage.textContent = "Sign in history not available";
        return;
    }

    if (data.attempts.length == 0)
    {
        auditMessage.textContent = "no sign in attempts yet";
    }

    data.attempts.forEach(function(attempt)
    {
        const row = document.createElement("tr");
        const cells = [
            attempt.method,
            new Date(attempt.at).toLocaleString(),
            attempt.outcome
        ];

       cells.forEach(function (text) {
            const cell = document.createElement("td");
            cell.textContent = text;
            row.appendChild(cell);
        });
        
        auditRows.appendChild(row);
    
    });

    logoutButton.addEventListener("click", async function () {
    try {
        await logout();
    } catch (error) {
        console.error("Logout failed:", error);
    }
    window.location.href = "index.html";
});

checkSession();
loadAudit();


}