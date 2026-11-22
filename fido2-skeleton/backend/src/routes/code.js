// OWNER: backend 3 — fallback one-time codes (TOTP).
// This is the weakest login method on purpose: codes can be phished.
// Implement it, then explain in the analysis why passkeys aren't phishable.
import { Router } from 'express';
import { requireFields, validUsername } from '../middleware/validate.js';
import { requireSession, createSession } from '../middleware/session.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { newSecret, otpauthURI, verifyCode, getTotpStep } from '../services/totp.js';
import { logAttempt, getUserById, getUserByUsername, enrollTotp, setLastTotpStep } from '../db/index.js';

const router = Router();
// Check whether the logged-in user has enrolled an authenticator.
router.get('/code/status', requireSession, (req, res) => {
  const user = getUserById(req.session.userId);

  if (!user) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }

  res.json({
    totpEnabled: Boolean(user.totp_secret)
  });
});

// Turn on codes for a user who is ALREADY logged in (e.g. with a passkey).
// Returns the otpauth:// URI; the frontend renders it as a QR code.

router.post('/code/enroll', requireSession, (req, res) => {
  const user = getUserById(req.session.userId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  // Do not overwrite an existing authenticator setup.
  if (user.totp_secret) {
    return res.status(409).json({
      error: 'Authenticator already enrolled'
    });
  }

  const secret = newSecret();

  // Temporary enrollment data.
  // Do not save the secret as active until confirmed.
  req.app.locals.pendingTotp ??= new Map();

  req.app.locals.pendingTotp.set(user.id, {
    secret,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  res.json({
    otpauthURI: otpauthURI(user.username, secret),
    manualKey: secret
  });

});


router.post(
  '/code/enroll/confirm',
  requireSession,
  rateLimit('code-verify'),
  requireFields(['code']),
  (req, res) => {
    const user = getUserById(req.session.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (user.totp_secret) {
      return res.status(409).json({
        error: 'Authenticator already enrolled'
      });
    }

    const pending = req.app.locals.pendingTotp?.get(user.id);

    if (!pending || Date.now() > pending.expiresAt) {
      req.app.locals.pendingTotp?.delete(user.id);

      return res.status(400).json({
        error: 'Enrollment expired. Please start again.'
      });
    }

    const code = String(req.body.code);

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: 'Enter a valid 6-digit code'
      });
    }

    const step = getTotpStep(pending.secret, code);
    if (step === null) {
      return res.status(400).json({
        error: 'Incorrect authentication code'
      });
    }
    const saved = enrollTotp({
      user_id: user.id,
      totp_secret: pending.secret,
      step
    });

    if (!saved) {
      return res.status(500).json({
        error: 'Could not save authenticator setup'
      });
    }

    req.app.locals.pendingTotp.delete(user.id);

    res.json({
      enrolled: true,
      message: 'Authenticator setup complete'
    });
  }
);


// Log in with a 6-digit code. Rate-limited so it can't be brute-forced.
router.post(
  '/code/verify',
  rateLimit('code-verify'),
  validUsername,
  requireFields(['username', 'code']),
  (req, res) => {
    const { username, code } = req.body;

    const user = getUserByUsername(username);

    // Reject unknown users and users without TOTP enrollment.
    if (!user || !user.totp_secret) {
      logAttempt({
        username,
        method: 'code',
        outcome: 'fail',
        detail: 'Invalid TOTP login'
      });

      return res.status(400).json({
        verified: false,
        error: 'Invalid authentication code'
      });
    }

    const step = getTotpStep(user.totp_secret, code);

    if (step === null) {
      logAttempt({
        username,
        method: 'code',
        outcome: 'fail',
        detail: 'Invalid TOTP code'
      });

      return res.status(400).json({
        verified: false,
        error: 'Invalid authentication code'
      });
    }

    // Atomically prevent reuse of the same or older time step.
    const accepted = setLastTotpStep({
      user_id: user.id,
      step
    });

    if (!accepted) {
      logAttempt({
        username,
        method: 'code',
        outcome: 'fail',
        detail: 'Reused TOTP code'
      });

      return res.status(400).json({
        verified: false,
        error: 'Code already used or expired'
      });
    }

    // Create a session for the real user.
    createSession(res, user.id, 'code');

    logAttempt({
      username,
      method: 'code',
      outcome: 'success',
      detail: 'TOTP verification succeeded'
    });

    return res.json({
      verified: true
    });
  }
);


export default router;
