// OWNER: backend 3 — account recovery.
// Recovery is where most passwordless systems are weakest: if "I lost my phone"
// is easier than logging in, attackers just use that door. Design it carefully.
import { Router } from 'express';
import { requireFields, validUsername } from '../middleware/validate.js';
import { requireSession } from '../middleware/session.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Generate one-time recovery codes for a logged-in user.
// Show them to the user ONCE; store only hashes (like passwords).
router.post('/recovery/codes', requireSession, (_req, res) => {
  // TODO (backend 3): generate ~8 random codes, hash each (crypto.scrypt or sha256 + salt),
  // save hashes in recovery_codes, return the plaintext codes once.
  res.status(501).json({ error: 'recovery/codes not implemented yet' });
});

// Use a recovery code to get back in (e.g. lost every passkey).
router.post('/recovery/verify', rateLimit('recovery'), validUsername, requireFields(['username', 'recoveryCode']), (_req, res) => {
  // TODO (backend 3): hash the submitted code, match against unused rows,
  // mark it used, then issue a LIMITED session that can only register a new passkey.
  res.status(501).json({ error: 'recovery/verify not implemented yet' });
});

export default router;
