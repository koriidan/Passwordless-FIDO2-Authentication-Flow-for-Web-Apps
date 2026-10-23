// OWNER: backend 5 — device/session dashboard + audit log.
import { Router } from 'express';
import { requireSession } from '../middleware/session.js';

const router = Router();

// List this user's registered passkeys (and later, active sessions).
router.get('/devices', requireSession, (_req, res) => {
  // TODO (backend 5): query credentials WHERE user_id = req.session.userId.
  // Return id, created_at, transports. Never return the public key bytes.
  res.json({ devices: [] });
});

// Revoke one passkey. Lost laptop -> delete its credential -> it can't log in again.
router.delete('/devices/:credentialId', requireSession, (_req, res) => {
  // TODO (backend 5): delete only if the credential belongs to req.session.userId.
  // Think about: should a user be allowed to delete their LAST passkey?
  res.status(501).json({ error: 'device revoke not implemented yet' });
});

// This user's recent login attempts — also useful evidence for the writeup.
router.get('/audit', requireSession, (_req, res) => {
  // TODO (backend 5): query audit_log for this user, newest first, limit 50.
  res.json({ attempts: [] });
});

export default router;
