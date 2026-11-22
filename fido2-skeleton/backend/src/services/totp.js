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
  if (!secret || !/^\d{6}$/.test(String(code))) {
    return false;
  }

  return authenticator.verify({
    token: String(code),
    secret
  });
}


export function getTotpStep(secret, code) {
  if (!secret || !/^\d{6}$/.test(String(code))) {
    return null;
  }

  // Create an authenticator with explicit TOTP settings.
  const totpAuth = authenticator.clone();

  totpAuth.options = {
    step: 30,
    window: 1
  };

  const delta = totpAuth.checkDelta(
    String(code),
    secret
  );

  if (delta === null) {
    return null;
  }

  const currentStep = Math.floor(Date.now() / 30000);

  return currentStep + delta;
}
