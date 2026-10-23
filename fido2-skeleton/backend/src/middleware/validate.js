// Server-side input validation / sanitizing.
// Remember: the browser's checks are UX only. THIS is the real gate —
// an attacker can skip the frontend entirely and hit these endpoints with curl.
export function requireFields(fields) {
  return (req, res, next) => {
    for (const f of fields) {
      if (req.body?.[f] === undefined || req.body[f] === '') {
        return res.status(400).json({ error: `Missing field: ${f}` });
      }
    }
    next();
  };
}

// Basic username shape check. Tighten as needed.
export function validUsername(req, res, next) {
  const u = req.body?.username;
  if (typeof u !== 'string' || u.length > 254) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  next();
}
