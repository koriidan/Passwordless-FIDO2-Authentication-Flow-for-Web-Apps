# Passwordless FIDO2 Authentication Flow for Web Apps

**CS4389 Data and Application Security: Final Project**

Melisha Schramek, Lydia Chen, Annette Rodriguez, Ximena Perez, Lauren Flores,
Nathan Buck, Naomi Shah, Michael Dragos, Daniel Nguyen

---

## Overview

A sample web application where users sign in **without a password**. Instead of
typing a secret that can be phished, guessed, or leaked, users prove who they are
with a FIDO2 authenticator such as Windows Hello, Touch ID, an Android phone, or a
hardware security key.

The system supports multiple sign-in methods, similar to commercial services
such as Duo:

| Method | How it works | Security role |
|---|---|---|
| **Passkey (FIDO2 / WebAuthn)** | The authenticator signs a server challenge with a private key that never leaves the device | Primary method; phishing-resistant because credentials are bound to the site's origin |
| **Push approval** | A login on one device is approved on a second registered device, with number matching | Convenient second option; number matching defends against MFA-fatigue attacks |
| **One-time code (TOTP)** | A 6-digit code from an authenticator app | Fallback; included and analyzed as the weakest method, since codes can be phished |

Planned supporting features include rate limiting and lockout, account recovery
with hashed one-time recovery codes, a registered-device dashboard with
revocation, and an audit log of authentication attempts.

## Project status

In progress. Frontend login and registration pages are built; backend
authentication logic is under active development. See the Deliverable 1 report
for the current timeline.

## Repository layout

```
fido2-skeleton/
├── API_CONTRACT.md   Endpoints and JSON formats shared by frontend and backend
├── README.md         Detailed setup and backend task breakdown
├── backend/          Node.js + Express + SimpleWebAuthn API server (port 3000)
└── frontend/         HTML/CSS/JS pages served with Vite (port 5173)
```

## Running the project

**Requirements:** Node.js 20 or newer, and a browser that supports WebAuthn
(current Chrome, Edge, Safari, or Firefox).

Start the backend and frontend in **two separate terminals**.

**Terminal 1: backend**

```powershell
cd fido2-skeleton/backend
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm install
npm run dev
```

Check it is running: `http://localhost:3000/health` should return `{"ok":true}`.

**Terminal 2: frontend**

```powershell
cd fido2-skeleton/frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

> Passkeys are bound to the site's origin, so use `localhost` exactly as shown
> (not `127.0.0.1`). The backend's `.env` must list the same origin the frontend
> runs on.

## Testing

Testing instructions and security evaluation results will be added as features
are completed. Planned tests include passkey registration and login, push approval
with number matching, code brute-force lockout, and attack demonstrations
(a phishing page and push-request spam) run against our own local deployment.

---

## AI Use Disclosure

Per the course's Responsible AI Use policy, we disclose the following use of
**Claude (Anthropic)**.

### What AI was used for

- **Exploring approaches:** comparing a WPA2/WPA3 attack-and-defense project with
  a FIDO2 build. We chose FIDO2.
- **Clarifying concepts:** why the browser and server communicate through APIs
  rather than direct function calls, why validation done in the browser must be
  repeated on the server, and the difference between persistent and in-memory
  storage.
- **Initial skeleton code:** Claude generated the starting backend structure
  (folder layout, `API_CONTRACT.md`, database schema, and stub routes marked with
  `TODO` comments). The authentication logic marked `TODO` is being written by
  the team.
- **Documentation:** Claude drafted this root README, including this disclosure,
  from information we provided. We reviewed it for accuracy.

### Prompts used

1. "What application should we make that follows the project description
   [Authentication, Identity Management, and Wireless Security]..."
2. "If we were to go towards the WPA route... how would we do anything with WPA?"
3. "Is there any way to do this all through simulation, with no hardware?"
4. "Why do I need APIs for these calls, is it the same as calling functions?"
5. "So the backend isn't much in the browser other than input sanitizing?"
6. "I'm planning to create the repo as a skeleton structure for backend. Should
   frontend be on there too?"
7. "Can you list the distribution of work between the backend people... and
   explain the flow of the program and what it means to keep something persistent?"

### Melisha's prompts (using Copilot)
1. How do I run the program?
2. Create a list with examples of each to do for backend 1
3. Summarize and explain in detail the skeleton code given for my sections
4. I do not see POST on the devtools, where would that be
5. I tested both the register html and the dashboard hmtl page, however when I input the registered username into the dashboard
    it says it failed to update counter. why is that and where should I look to fix it? 
6. when i test it, i have both a register html page and a index html page. the register page works fine. but when i put the login info for an account that is registered already it shuts down the backend. the terminal for the backend says this when it happens: FIDO2 backend listening on http://localhost:3000
      RP ID: localhost · expecting frontend origin: http://localhost:5173
    file:///C:/Users/Melis/Documents/GitHub/Passwordless-FIDO2-Authentication-Flow-for-Web-Apps/fido2-skeleton/backend/src/services/webauthn.js:56
        allowCredentials: allowCredentials.map((credential) => ({
                                          ^

    TypeError: allowCredentials.map is not a function
        at buildAuthenticationOptions (file:///C:/Users/Melis/Documents/GitHub/Passwordless-FIDO2-Authentication-Flow-for-Web-Apps/fido2-skeleton/backend/src/services/webauthn.js:56:40)
        at file:///C:/Users/Melis/Documents/GitHub/Passwordless-FIDO2-Authentication-Flow-for-Web-Apps/fido2-skeleton/backend/src/routes/auth.js:98:25
        at Layer.handle [as handle_request] (C:\Users\Melis\Documents\GitHub\Passwordless-FIDO2-Authentication-Flow-for-Web-Apps\fido2-skeleton\backend\node_modules\express\lib\router\layer.js:95:5)
        at next (C:\Users\Melis\Documents\GitHub\Passwordless-FIDO2-Authentication-Flow-for-Web-Apps\fido2-skeleton\backend\node_modules\express\lib\router\route.js:149:13)
        at file:///C:/Users/Melis/Documents/GitHub/Passwordless-FIDO2-Authentication-Flow-for-Web-Apps/fido2-skeleton/backend/src/middleware/validate.js:11:5
        at Layer.handle [as handle_request] (C:\Users\Melis\Documents\GitHub\Passwordless-FIDO2-Authentication-Flow-for-Web-Apps\fido2-skeleton\backend\node_modules\express\lib\router\layer.js:95:5)
        at next (C:\Users\Melis\Documents\GitHub\Passwordless-FIDO2-Authentication-Flow-for-Web-Apps\fido2-skeleton\backend\node_modules\express\lib\router\route.js:149:13)
        at validUsername (file:///C:/Users/Melis/Documents/GitHub/Passwordless-FIDO2-Authentication-Flow-for-Web-Apps/fido2-skeleton/backend/src/middleware/validate.js:21:3)
        at Layer.handle [as handle_request] (C:\Users\Melis\Documents\GitHub\Passwordless-FIDO2-Authentication-Flow-for-Web-Apps\fido2-skeleton\backend\node_modules\express\lib\router\layer.js:95:5)
        at next (C:\Users\Melis\Documents\GitHub\Passwordless-FIDO2-Authentication-Flow-for-Web-Apps\fido2-skeleton\backend\node_modules\express\lib\router\route.js:149:13)

    Node.js v22.23.5
    Failed running 'src/server.js'. Waiting for file changes before restarting... why does it say that and how can i fix it?
7. Is everything working well? are there anymore tests I should do 

### Reflection

Claude helped us choose the FIDO2 project and gave us a starting structure when
we did not know how to begin. Our understanding changed in one key place: we had
assumed input sanitizing could be handled in the browser, but learned that the
server must enforce all validation because an attacker controls the browser. The
team is writing the authentication, database, session, and recovery logic itself.

> Team members who use AI for their own parts should add their prompts and a short
> reflection to this section.

### Melisha's reflection

Copilot helped me get started on the project. At the beginning, I was not too familiar with programming projects that required authentication so I was a bit
confused with the skeleton code. However, Copilot was able to point me in the right direction and help me understand the skeleton I would be implementing
everything on. I also do not typically run programs that have a html page so I had to learn how to set it up and run it on my local machine, which Copilot 
assisted with as well. I also used it in order to aid with debugging when I was not sure what was going on or where the issue was.
