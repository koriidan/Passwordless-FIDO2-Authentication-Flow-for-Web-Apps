# API Contract

The agreement between **backend** and **frontend**. Lock this down before writing much code — once the JSON shapes are fixed, both teams build in parallel. Change it only by editing this file and telling the group.

Base URL: `http://localhost:3000`
All bodies are JSON. All responses include an HTTP status code the frontend should check.

Legend: 🔑 = passkey path · 📲 = push path · 🔢 = fallback code path

---

## Registration (first-time: create a passkey) 🔑

### `POST /register/options`
Frontend sends who's registering; backend returns a WebAuthn challenge to hand to the browser.

Request:
```json
{ "username": "alice@example.com", "displayName": "Alice" }
```
Response `200`:
```json
{
  "challenge": "base64url...",
  "rp": { "name": "CS4389 Demo", "id": "localhost" },
  "user": { "id": "base64url...", "name": "alice@example.com", "displayName": "Alice" },
  "pubKeyCredParams": [{ "type": "public-key", "alg": -7 }],
  "timeout": 60000,
  "authenticatorSelection": { "userVerification": "preferred" }
}
```
> Frontend passes this straight to `navigator.credentials.create({ publicKey })`.

### `POST /register/verify`
Frontend returns what the authenticator produced; backend verifies and stores the public key.

Request:
```json
{ "username": "alice@example.com", "attestationResponse": { "id": "...", "rawId": "...", "response": { "...": "..." }, "type": "public-key" } }
```
Response `200`: `{ "verified": true }`  ·  on failure `400`: `{ "verified": false, "error": "reason" }`

---

## Login with passkey 🔑

### `POST /login/options`
Request: `{ "username": "alice@example.com" }`
Response `200`:
```json
{ "challenge": "base64url...", "allowCredentials": [{ "type": "public-key", "id": "base64url..." }], "timeout": 60000, "userVerification": "preferred" }
```
> Frontend passes this to `navigator.credentials.get({ publicKey })`.

### `POST /login/verify`
Request:
```json
{ "username": "alice@example.com", "assertionResponse": { "id": "...", "rawId": "...", "response": { "...": "..." }, "type": "public-key" } }
```
Response `200`: `{ "verified": true, "session": "token" }` (session also set as httpOnly cookie)

---

## Push approval (Duo-style) 📲

The laptop and the phone get **different** data on purpose: the laptop only sees the correct number, the phone only sees the three choices. Neither one alone can approve.

### `POST /push/initiate` — laptop
Request: `{ "username": "alice@example.com" }`
Response `200`: `{ "requestId": "uuid", "correctNumber": 42 }`
> Laptop displays 42. `429` if this user is being spammed with requests.

### `GET /push/status/:requestId` — laptop
Laptop polls this until it resolves (or swap for a WebSocket later).
Response `200`: `{ "status": "pending" | "approved" | "denied" | "expired" }`
> On `approved`, the session cookie is set on this response. Requests expire after 60 s.

### `GET /push/pending` — phone (requires approver session)
Response `200`: `{ "requests": [{ "requestId": "uuid", "choices": [17, 42, 88] }] }`

### `POST /push/respond` — phone (requires approver session)
Request: `{ "requestId": "uuid", "chosenNumber": 42, "approve": true }`
Response `200`: `{ "status": "approved" }` · wrong number or deny → `{ "status": "denied" }` · already answered → `409`

---

## Fallback code (TOTP) 🔢

### `POST /code/enroll` (requires session)
Turns on codes for an already-logged-in user.
Response `200`: `{ "otpauthURI": "otpauth://totp/CS4389%20Demo:alice@example.com?secret=...&issuer=CS4389%20Demo" }`
> Frontend renders this as a QR code for an authenticator app to scan.

### `POST /code/verify`
Request: `{ "username": "alice@example.com", "code": "123456" }`
Response `200`: `{ "verified": true }` (session cookie set) · bad code → `400` · too many tries → `429`

---

## Account recovery

### `POST /recovery/codes` (requires session)
Response `200`: `{ "codes": ["abcd-efgh", "..."] }`
> Shown to the user **once**. The server only keeps hashes.

### `POST /recovery/verify`
Request: `{ "username": "alice@example.com", "recoveryCode": "abcd-efgh" }`
Response `200`: `{ "verified": true }` → a limited session that can only register a new passkey · `429` if rate-limited

---

## Devices + audit (dashboard)

### `GET /devices` (requires session)
Response `200`: `{ "devices": [{ "credentialId": "base64url", "createdAt": 1729650000000, "transports": ["internal"] }] }`

### `DELETE /devices/:credentialId` (requires session)
Response `200`: `{ "ok": true }` · not yours → `404`

### `GET /audit` (requires session)
Response `200`: `{ "attempts": [{ "method": "push", "outcome": "fail", "detail": "wrong number", "at": 1729650000000 }] }`

---

## Session

### `GET /session`
Reads the session cookie/token. Response `200`: `{ "authenticated": true, "username": "alice@example.com", "method": "passkey" }` · `401` if not logged in.

### `POST /logout`
Clears the session. Response `200`: `{ "ok": true }`

---

## Conventions

- Every error: `{ "error": "human-readable message" }` + a 4xx/5xx status.
- `401` = not logged in · `429` = too many attempts, back off · `501` = not built yet.
- Backend **re-validates everything** — the frontend's checks are UX only.
- `rp.id` is `localhost` in dev; the passkey is bound to this origin (that binding is what makes it phishing-resistant — don't fake the origin).
