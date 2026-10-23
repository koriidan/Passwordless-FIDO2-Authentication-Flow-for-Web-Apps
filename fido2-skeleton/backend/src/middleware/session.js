// OWNER: backend 4 — sessions.
import crypto from 'node:crypto';

// Minimal session handling. Issues an opaque random token, sets it as an
// httpOnly cookie, and looks it up on protected routes.
// TODO (backend 4): persist sessions in the DB (sessions table) instead of memory,
// and add expiry. node --watch restarts on every file save, which wipes this Map
// and logs everyone out.
// TODO (backend 4): add `secure: true` to the cookie once you serve over HTTPS.
const sessions = new Map(); // token -> { userId, method }

export function createSession(res, userId, method) {
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, { userId, method });
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
  return token;
}

export function requireSession(req, res, next) {
  const token = req.cookies?.session;
  const s = token && sessions.get(token);
  if (!s) return res.status(401).json({ error: 'Not authenticated' });
  req.session = s;
  next();
}

export function destroySession(req, res) {
  const token = req.cookies?.session;
  if (token) sessions.delete(token);
  res.clearCookie('session');
}
