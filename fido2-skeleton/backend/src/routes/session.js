// OWNER: backend 4 — sessions.
import { Router } from 'express';
import { requireSession, destroySession } from '../middleware/session.js';

const router = Router();

router.get('/session', requireSession, (req, res) => {
  res.json({ authenticated: true, method: req.session.method });
  // TODO (backend 4): include username by looking up req.session.userId.
});

router.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

export default router;
