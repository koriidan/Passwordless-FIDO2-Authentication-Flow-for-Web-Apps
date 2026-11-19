// OWNER: backend 1 — passkey registration + login.
import { Router } from 'express';
import { requireFields, validUsername } from '../middleware/validate.js';
import { createSession } from '../middleware/session.js';
import {
  buildRegistrationOptions,
  checkRegistration,
  buildAuthenticationOptions,
  checkAuthentication,
  getAuthenticationChallenge,
  clearAuthenticationChallenge,
} from '../services/webauthn.js';

//melisha - bringing these in from backend4's stuff
import crypto from 'node:crypto';
import
{
  getUserByUsername,
  createUser,
  saveCredential,
  getCredentialsForUser,
  getCredentialsForId,
  updateCounter,
  logAttempt,
} from '../db/index.js';

const router = Router();

// --- Registration (create a passkey) ---------------------------------------

//melisha - changed this from the skeleton code
router.post('/register/options', validUsername, requireFields(['username']), async (req, res) => {
  const { username, displayName } = req.body;

  // TODO (backend 1): look up or create the user, fetch their existing creds.

 let user = await getUserByUsername(username);
  if (!user) { //if not found, create a new user!
    const id = crypto.randomBytes(32).toString('base64url');
    createUser({ id, username, display_name: displayName || username, });
    user = getUserByUsername(username);
  }

  const existingCreds = getCredentialsForUser(user.id);

  const options = await buildRegistrationOptions ( {id: user.id, username: user.username, displayName: user.display_name || displayName || user.username, }, existingCreds, );

  res.json(options);
});

//melisha
router.post('/register/verify', validUsername, requireFields(['attestationResponse']), async (req, res) => {
  const { username, attestationResponse } = req.body;

  const user = getUserByUsername(username);
  if (!user) return res.status(400).json({ verified: false, error: 'User not found! they are not registered.' });

  const result = await checkRegistration(username, attestationResponse);
  // TODO (backend 1): persist the credential from result.registrationInfo.
  if (!result.verified || !result.registrationInfo)
  {
    logAttempt({username, method: 'passkey-register', outcome: 'failed', detail: 'Registration verification has failed!',}
    );

    return res.status(400).json({ verified: false, error: 'Registration verification has failed!' });
  }
  
  const { credential } = result.registrationInfo;
  credential.id;
  credential.publicKey;
  credential.counter;
  credential.transports;

  saveCredential( {credential_id: credential.id, user_id: user.id, public_key: credential.publicKey, counter: credential.counter, transports: credential.transports || [], });

  logAttempt({username, method: 'passkey-register', outcome: 'success', detail: 'Registration verification has succeeded!',});

  res.json({ verified: true });
});

// --- Login with passkey -----------------------------------------------------

//melisha - changed this from the skeleton code
router.post('/login/options', validUsername, requireFields(['username']), async (req, res) => {
  // TODO (backend 1): fetch this user's credentials to populate allowCredentials.
  const { username } = req.body;
  const user = getUserByUsername(username);
  if (!user) {
    return res.status(400).json({ error: 'User not found! they are not registered.' }); 
  }

  const existingCreds = getCredentialsForUser(user.id);

  if(existingCreds.length === 0) {
    return res.status(400).json({ error: 'User has no registered credentials! they are not registered.' });
  }

  const options = await buildAuthenticationOptions(username, existingCreds);
  res.json(options);
});

//melisha - changed this from the skeleton code
router.post('/login/verify', validUsername, requireFields(['assertionResponse']), async (req, res) => {
  // TODO (backend 1): load stored credential + expected challenge, then:
  //   const result = await checkAuthentication(req.body.assertionResponse, cred, challenge);
  //   if verified -> createSession(res, userId, 'passkey')
  const { username, assertionResponse } = req.body;

  const user = getUserByUsername(username);
  if (!user) return res.status(400).json({ verified: false, error: 'User not found! they are not registered.' });
  
  const credential = getCredentialsForId(assertionResponse.id);
  
  if (!credential || credential.user_id !== user.id)
  { logAttempt({username, method: 'passkey-login', outcome: 'failed', detail: 'Credential not found or does not belong to user!',});
  
    return res.status(400).json({ error: 'Login failed' });
  }
  
  const result = await checkAuthentication(assertionResponse, credential, getAuthenticationChallenge(username));
  clearAuthenticationChallenge(username);

  if (!result.verified)
  { 
    logAttempt({username, method: 'passkey-login', outcome: 'failed', detail: 'Authentication verification has failed!',});
    return res.status(400).json({ error: 'Login failed' });
  }

  const newCounter = result.authenticationInfo.newCounter;
  if (newCounter > credential.counter) {
    if (!updateCounter(credential.credential_id, newCounter)) {
      logAttempt({
        username,
        method: 'passkey-login',
        outcome: 'failed',
        detail: 'Counter update failed',
      });
      return res.status(500).json({ error: 'Failed to update counter' });
    }
  } else if (credential.counter !== 0 || newCounter !== 0) {
    logAttempt({
      username,
      method: 'passkey-login',
      outcome: 'failed',
      detail: 'Counter did not increase',
    });
    return res.status(400).json({ error: 'Login replay rejected' });
  }


  const session = createSession(res, user.id, 'passkey');

  logAttempt({username, method: 'passkey-login', outcome: 'success', detail: 'Passkey login successful!',});

  res.json({ verified: true, session });
});

// Fallback-code routes moved to routes/code.js (backend 3).

export default router;
