// OWNER: backend 4 — sessions.
import { Router } from 'express';
import { requireSession, destroySession } from '../middleware/session.js';
import {getUserById} from '../db/index.js';

const router = Router();

router.get('/session', requireSession, (req, res) => {
  const user = getUserById(req.session.userId);
  if(!user)
    return res.status(401).json({ error: 'Not authenticated' });
  const username = user.username;
  if(username == null)
    return res.status(401).json({ error: 'Not authenticated' });
  res.json({ authenticated: true, username, method: req.session.method });
});

router.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

export default router;
