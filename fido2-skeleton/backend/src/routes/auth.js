// OWNER: backend 1 — passkey registration + login.
import { Router } from 'express';
import { requireFields, validUsername } from '../middleware/validate.js';
import { createSession } from '../middleware/session.js';
import {
  buildRegistrationOptions,
  checkRegistration,
  buildAuthenticationOptions,
  checkAuthentication,
} from '../services/webauthn.js';

const router = Router();

// --- Registration (create a passkey) ---------------------------------------

router.post('/register/options', validUsername, requireFields(['username']), async (req, res) => {
  const { username, displayName } = req.body;
  // TODO (backend 1): look up or create the user, fetch their existing creds.
  const user = { username, displayName: displayName || username, id: 'TODO' };
  const options = await buildRegistrationOptions(user, []);
  res.json(options);
});

router.post('/register/verify', validUsername, requireFields(['attestationResponse']), async (req, res) => {
  const { username, attestationResponse } = req.body;
  const result = await checkRegistration(username, attestationResponse);
  if (!result.verified) return res.status(400).json({ verified: false, error: 'Verification failed' });
  // TODO (backend 1): persist the credential from result.registrationInfo.
  res.json({ verified: true });
});

// --- Login with passkey -----------------------------------------------------

router.post('/login/options', validUsername, requireFields(['username']), async (req, res) => {
  // TODO (backend 1): fetch this user's credentials to populate allowCredentials.
  const options = await buildAuthenticationOptions([]);
  res.json(options);
});

router.post('/login/verify', validUsername, requireFields(['assertionResponse']), async (req, res) => {
  // TODO (backend 1): load stored credential + expected challenge, then:
  //   const result = await checkAuthentication(req.body.assertionResponse, cred, challenge);
  //   if verified -> createSession(res, userId, 'passkey')
  res.status(501).json({ error: 'login/verify not implemented yet' });
});

// Fallback-code routes moved to routes/code.js (backend 3).

export default router;
