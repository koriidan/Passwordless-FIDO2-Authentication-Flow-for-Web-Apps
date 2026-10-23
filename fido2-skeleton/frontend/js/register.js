
console.log("Registration page loaded!");

const registerForm = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const displayNameInput = document.getElementById("displayName");
const message = document.getElementById("message");

registerForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const displayName = displayNameInput.value.trim();

    if (!username || !displayName) {
        message.textContent = "Please fill out all fields.";
        return;
    }

    message.textContent =
        `Registration form is ready for ${displayName} (${username}). ` +
        "Passkey creation will be connected to the backend next.";

    console.log("Registration form submitted (demo only)");
});
