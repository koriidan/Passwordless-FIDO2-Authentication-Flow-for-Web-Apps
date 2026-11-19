// OWNER: backend 4 — sessions.
import crypto from 'node:crypto';
import {createSessionRow, getSessionRow, deleteSessionRow} from 
'../db/index.js'

// Minimal session handling. Issues an opaque random token, sets it as an
// httpOnly cookie, and looks it up on protected routes.
// TODO (backend 4): persist sessions in the DB (sessions table) instead of memory,
// and add expiry. node --watch restarts on every file save, which wipes this Map
// and logs everyone out.
// TODO (backend 4): add `secure: true` to the cookie once you serve over HTTPS.

const SESSION_TTL_MS  = 8 * 60 * 60 * 1000;   // e.g. 8 hours
const RECOVERY_TTL_MS = 10 * 60 * 1000;       // 10 minutes
export function createSession(res, userId, method) {
  const token = crypto.randomBytes(32).toString('base64url');
  
  
  const ttl = method === "recovery" ? RECOVERY_TTL_MS : SESSION_TTL_MS;
  const expires_at = Date.now() + ttl;
    createSessionRow({token, user_id: userId, method, expires_at});
  
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
  return token;
}

export function requireSession(req, res, next) {
  const token = req.cookies?.session;
  const s = token && getSessionRow(token);
  
  if (!s) return res.status(401).json({ error: 'Not authenticated' });
  if (s.expires_at < Date.now()){
    deleteSessionRow(token);
    return res.status(401).json({ error: 'Session Expired'})
  }
  if (s.method === 'recovery') return res.status(403).json({ error: 'Not authenticated' });
  req.session = {userId:s.user_id, method: s.method};
  next();
}

export function requireSessionAllowRecovery(req, res, next) {
  const token = req.cookies?.session;
  const s = token && getSessionRow(token);
  
  if (!s) return res.status(401).json({ error: 'Not authenticated' });
  if (s.expires_at < Date.now()){
    deleteSessionRow(token);
    return res.status(401).json({ error: 'Session Expired'})
  }
  req.session = {userId:s.user_id, method: s.method};
  next();
}

export function destroySession(req, res) {
  const token = req.cookies?.session;
  if (token) deleteSessionRow(token);
  res.clearCookie('session');
}
