console.log("Frontend loaded successfully!");

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const message = document.getElementById("message");

function showMessage(text) {
    message.textContent = text;
}

function getUsername() {
    const username = usernameInput.value.trim();

    if (!username) {
        showMessage("Please enter your username.");
        usernameInput.focus();
        return null;
    }

    return username;
}

// Passkey login
loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const username = getUsername();
    if (!username) return;

    showMessage(`Passkey login for ${username} is coming soon.`);
});

// Push notification login
document.getElementById("pushLogin").addEventListener("click", function() {
    const username = getUsername();
    if (!username) return;

    showMessage(`Push notification login for ${username} is coming soon.`);
});

// Authenticator code login
document.getElementById("totpLogin").addEventListener("click", function() {
    const username = getUsername();
    if (!username) return;

    showMessage(`Authenticator code login for ${username} is coming soon.`);
});

