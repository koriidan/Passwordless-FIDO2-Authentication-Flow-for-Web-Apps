# Frontend — owned by the frontend team

This folder is yours. The backend team left it a stub on purpose so you can
structure it however you like (vanilla JS, React + Vite, whatever).

## What you're building against

Read **`../API_CONTRACT.md`** first — that's the agreed set of endpoints and
JSON shapes. You can build the whole UI against those shapes using fake/stubbed
responses before the backend is finished. Nobody waits on anybody.

## The one essential browser bit

The browser (your side) is the *only* place the WebAuthn hardware calls happen:

```js
// Registration: after GET /register/options
const cred = await navigator.credentials.create({ publicKey: optionsFromBackend });
// send `cred` to POST /register/verify

// Login: after GET /login/options
const assertion = await navigator.credentials.get({ publicKey: optionsFromBackend });
// send `assertion` to POST /login/verify
```

`@simplewebauthn/browser` has helpers (`startRegistration`, `startAuthentication`)
that wrap these and handle the base64url encoding for you — recommended.

Everything else is: collect input, call an endpoint, show the result. The backend
makes all the trust decisions; you render them.

## Screens to build

- Register (username → trigger passkey creation)
- Login — passkey
- Login — push (show the number to match; poll `/push/status/:id`)
- Login — fallback code
- Dashboard (the "logged in" page; later: device/session list)
- A separate tiny "approver" page for the phone (shows the 3 numbers)
