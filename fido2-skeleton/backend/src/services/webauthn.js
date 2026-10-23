// OWNER: backend 1 — FIDO2 / WebAuthn core.
// The FIDO2 / WebAuthn core. This is the heart of the project.
// SimpleWebAuthn does the cryptography; our job is to drive it correctly
// and store/verify the results. Nothing here is reimplemented crypto.
//
// Docs: https://simplewebauthn.dev/docs/packages/server
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { config } from '../config/index.js';

// Challenges are per-user and short-lived. In-memory map is fine for the demo;
// a production system would use a store with TTL. Document this choice.
const challengeStore = new Map(); // username -> challenge

// --- Registration -----------------------------------------------------------

export async function buildRegistrationOptions(user, existingCredentials = []) {
  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: user.username,
    userDisplayName: user.displayName,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((c) => ({ id: c.credential_id })),
    authenticatorSelection: { userVerification: 'preferred', residentKey: 'preferred' },
  });
  challengeStore.set(user.username, options.challenge);
  return options;
}

export async function checkRegistration(username, attestationResponse) {
  const expectedChallenge = challengeStore.get(username);
  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
  });
  challengeStore.delete(username);
  // verification.registrationInfo has { credential, ... } to persist.
  // TODO (backend 1): save credentialID, publicKey, counter to the DB here
  // (or return registrationInfo and let the route save it).
  return verification;
}

// --- Authentication ---------------------------------------------------------

export async function buildAuthenticationOptions(allowCredentials = []) {
  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    allowCredentials: allowCredentials.map((c) => ({ id: c.credential_id })),
    userVerification: 'preferred',
  });
  // TODO (backend 1): stash options.challenge keyed by username for the verify step.
  return options;
}

export async function checkAuthentication(assertionResponse, storedCredential, expectedChallenge) {
  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
    credential: {
      id: storedCredential.credential_id,
      publicKey: storedCredential.public_key,
      counter: storedCredential.counter,
    },
  });
  // verification.authenticationInfo.newCounter MUST be written back to the DB,
  // and must be strictly greater than the stored counter (replay check).
  // TODO (backend 1): update the stored counter here.
  return verification;
}
