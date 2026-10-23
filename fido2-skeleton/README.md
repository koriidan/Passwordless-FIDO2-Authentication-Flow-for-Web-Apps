# CS4389 — Passwordless / FIDO2 Authentication

A sample web app with **no password field**. Users authenticate three ways:

1. **Passkey** — real FIDO2 / WebAuthn (Touch ID, Windows Hello, YubiKey)
2. **Push approval** — Duo-style phone tap with number matching
3. **Fallback code** — TOTP (analyzed as the weakest path)

## Repo layout

```
backend/    ← Express + SimpleWebAuthn (owned by backend team)
frontend/   ← browser UI (owned by frontend team — stub only for now)
API_CONTRACT.md  ← the shared agreement between the two; read this first
```

## Running the backend

Windows PowerShell (one command per line):

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

macOS / Linux: `cd backend && cp .env.example .env && npm install && npm run dev`

Check it's alive: open `http://localhost:3000/health` → `{"ok":true}`.
(`Cannot GET /` at the root is normal — the backend is API-only, it has no homepage.)

> **If you pulled a schema change:** delete `backend/fido2.db` and restart. The tables
> are only created if missing, so an old database file won't get the new columns.

## Backend team split

Every file starts with an `// OWNER:` comment. Search for `TODO (backend N)` to find your tasks.

| # | Area | Files | Main tasks |
|---|------|-------|-----------|
| 1 | Passkeys | `services/webauthn.js`, `routes/auth.js` | Finish register + login ceremonies, challenges expire and are single-use, signature counter check, multiple passkeys per user |
| 2 | Push approval | `routes/push.js` | Issue session on approve, require approver session on `/push/pending` + `/push/respond`, request expiry, spam limit |
| 3 | Codes + recovery | `routes/code.js`, `services/totp.js`, `routes/recovery.js`, `middleware/rateLimit.js` | TOTP enroll + verify, brute-force lockout, code replay block, hashed recovery codes |
| 4 | DB + sessions | `db/index.js`, `middleware/session.js`, `routes/session.js` | DB helper functions **(everyone needs these — do first)**, persist sessions with expiry, cookie flags |
| 5 | Devices, audit, integration | `routes/devices.js` | `logAttempt()` in every route, device list/revoke, simple risk rule, end-to-end tests, attack demo scripts |

Backends 1 and 4 should pair early: passkeys can't be saved until the DB helpers exist.

> Frontend builds against `API_CONTRACT.md` with fake responses — nobody waits on anybody.
