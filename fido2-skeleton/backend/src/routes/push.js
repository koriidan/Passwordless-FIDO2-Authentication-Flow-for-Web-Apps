// OWNER: backend 2 — push approval (Duo-style) with number matching.
import { Router } from 'express';
import crypto from 'node:crypto';
import { requireFields, validUsername } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Pending push requests, kept in memory (they only live ~60s).
// requestId -> { username, choices, correct, status, createdAt }
const pending = new Map();
const REQUEST_TTL_MS = 60_000;

// Number matching defeats MFA fatigue: an attacker spamming requests can't
// know which number the real user's laptop is showing.
function numberChallenge() {
  const nums = new Set();
  while (nums.size < 3) nums.add(Math.floor(Math.random() * 90) + 10); // 10..99
  const choices = [...nums];
  return { choices, correct: choices[Math.floor(Math.random() * choices.length)] };
}

// LAPTOP: start a login. Gets back ONLY the correct number to display.
// The phone gets the three choices separately via /push/pending.
router.post('/push/initiate', rateLimit('push-initiate'), validUsername, requireFields(['username']), (req, res) => {
  const requestId = crypto.randomUUID();
  const { choices, correct } = numberChallenge();
  pending.set(requestId, {
    username: req.body.username,
    choices,
    correct,
    status: 'pending',
    createdAt: Date.now(),
  });
  res.json({ requestId, correctNumber: correct });
});

// LAPTOP: poll until approved/denied/expired.
router.get('/push/status/:requestId', (req, res) => {
  const p = pending.get(req.params.requestId);
  if (!p) return res.status(404).json({ error: 'Unknown request' });
  // TODO (backend 2): if Date.now() - p.createdAt > REQUEST_TTL_MS, mark 'expired'.
  // TODO (backend 2): on 'approved', issue a session here with createSession(res, userId, 'push').
  res.json({ status: p.status });
});

// PHONE: list requests waiting for this user's approval.
// TODO (backend 2): add requireSession so only a logged-in, registered approver
// device can see these, then filter by req.session's user.
router.get('/push/pending', (_req, res) => {
  const waiting = [...pending.entries()]
    .filter(([, p]) => p.status === 'pending')
    .map(([requestId, p]) => ({ requestId, choices: p.choices })); // never send `correct`
  res.json({ requests: waiting });
});

// PHONE: approve/deny and pick a number.
// SECURITY HOLE TO CLOSE: right now anyone who knows a requestId can approve it.
// TODO (backend 2): add requireSession and check the session's user owns this request.
router.post('/push/respond', requireFields(['requestId', 'chosenNumber', 'approve']), (req, res) => {
  const p = pending.get(req.body.requestId);
  if (!p) return res.status(404).json({ error: 'Unknown request' });
  if (p.status !== 'pending') return res.status(409).json({ error: `Request already ${p.status}` });
  const ok = req.body.approve === true && Number(req.body.chosenNumber) === p.correct;
  p.status = ok ? 'approved' : 'denied';
  // TODO (backend 5): logAttempt(p.username, 'push', p.status === 'approved' ? 'success' : 'fail')
  res.json({ status: p.status });
});

export { REQUEST_TTL_MS };
export default router;
