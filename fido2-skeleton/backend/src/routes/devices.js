// OWNER: backend 5 — device/session dashboard + audit log.
import { Router } from 'express';
import { requireSession } from '../middleware/session.js';
import { getDevicesForUser, getCredentialsForUser, deleteCredential, getUserById, getAuditForUser } from '../db/index.js';

const router = Router();

// List this user's registered passkeys (and later, active sessions).
router.get('/devices', requireSession, (req, res) => {
  // TODO (backend 5): query credentials WHERE user_id = req.session.userId.
  // Return id, created_at, transports. Never return the public key bytes.
  const rows = getDevicesForUser(req.session.userId);
  const devices = rows.map(row => ({
    credentialId: row.credential_id,
    createdAt: row.created_at,
    transports: JSON.parse(row.transports || '[]')
  }));
  res.json({ devices });
});

// Revoke one passkey. Lost laptop -> delete its credential -> it can't log in again.
router.delete('/devices/:credentialId', requireSession, (req, res) => {
  // TODO (backend 5): delete only if the credential belongs to req.session.userId.
  // Think about: should a user be allowed to delete their LAST passkey?
  const userId = req.session.userId;
  const credentialId = req.params.credentialId;
  const credentials = getCredentialsForUser(userId);

  const ownsCredential = credentials.some( (credential) => credential.credential_id === credentialId);
  if (!ownsCredential) {
    return res.status(404).json({ error: 'Device not found' });
  }
  if (credentials.length === 1) {
    return res.status(409).json({ error: 'Cannot revoke your last passkey' });
  }
  const deleted = deleteCredential({ credential_id: credentialId, user_id: userId });
  if (!deleted) {
    return res.status(404).json({ error: 'Device not found' });
  }
  return res.json({ ok: true });
});

// This user's recent login attempts — also useful evidence for the writeup.
router.get('/audit', requireSession, (req, res) => {
  // TODO (backend 5): query audit_log for this user, newest first, limit 50.
  const user = getUserById(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const rows = getAuditForUser(user.username);
  const attempts = rows.map(row => ({
    method: row.method,
    outcome: row.outcome,
    detail: row.detail,
    at: row.at
  }));
  
  res.json({ attempts });
});

export default router;
