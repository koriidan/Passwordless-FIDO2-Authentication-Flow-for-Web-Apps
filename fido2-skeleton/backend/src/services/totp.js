// OWNER: backend 3 — TOTP helpers.
import { authenticator } from 'otplib';
import { config } from '../config/index.js';

// New random secret for a user enrolling in codes.
export function newSecret() {
  return authenticator.generateSecret();
}

// The otpauth:// link an authenticator app (Google Authenticator, Authy) scans.
export function otpauthURI(username, secret) {
  return authenticator.keyuri(username, config.rpName, secret);
}

// True if the 6-digit code matches the secret right now.
export function verifyCode(secret, code) {
  // TODO (backend 3): return authenticator.verify({ token: code, secret });
  // Consider allowing one step of clock drift and document the tradeoff.
  return false;
}
