// OWNER: backend 3 — fallback one-time codes (TOTP).
// This is the weakest login method on purpose: codes can be phished.
// Implement it, then explain in the analysis why passkeys aren't phishable.
import { Router } from 'express';
import { requireFields, validUsername } from '../middleware/validate.js';
import { requireSession, createSession } from '../middleware/session.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { newSecret, otpauthURI, verifyCode } from '../services/totp.js';

const router = Router();

// Turn on codes for a user who is ALREADY logged in (e.g. with a passkey).
// Returns the otpauth:// URI; the frontend renders it as a QR code.
router.post('/code/enroll', requireSession, (req, res) => {
  const secret = newSecret();
  // TODO (backend 3): save `secret` on the user row (users.totp_secret) via a backend-4 DB helper.
  // TODO (backend 3): look up the real username from req.session.userId.
  res.json({ otpauthURI: otpauthURI('TODO-username', secret) });
});

// Log in with a 6-digit code. Rate-limited so it can't be brute-forced.
router.post('/code/verify', rateLimit('code-verify'), validUsername, requireFields(['username', 'code']), (req, res) => {
  // TODO (backend 3): load the user's totp_secret and last_totp_step.
  // TODO (backend 3): reject a code whose time step was already used (replay).
  const ok = verifyCode('TODO-secret', req.body.code);
  // TODO (backend 5): logAttempt(username, 'code', ok ? 'success' : 'fail')
  if (!ok) return res.status(400).json({ verified: false, error: 'Bad code' });
  createSession(res, 'TODO-userId', 'code');
  res.json({ verified: true });
});

export default router;
