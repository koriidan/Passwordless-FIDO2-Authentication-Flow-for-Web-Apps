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


### Reflection

Claude helped us choose the FIDO2 project and gave us a starting structure when
we did not know how to begin. Our understanding changed in one key place: we had
assumed input sanitizing could be handled in the browser, but learned that the
server must enforce all validation because an attacker controls the browser. The
team is writing the authentication, database, session, and recovery logic itself.

> Team members who use AI for their own parts should add their prompts and a short
> reflection to this section.
