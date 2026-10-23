// OWNER: backend 3 (shared with backend 2 for push spam).
// Simple in-memory rate limiter / lockout. Used for:
//   - /code/verify: a 6-digit code has only 1,000,000 values, so without a
//     limit it can be brute-forced. Lock after ~5 failures.
//   - /push/initiate: refuse push spam (the other half of the MFA-fatigue defense).
//
// Right now this is a pass-through so the app runs. Fill it in.
const buckets = new Map(); // `${name}:${username}` -> { count, firstAt, lockedUntil }

export function rateLimit(name, { max = 5, windowMs = 60_000 } = {}) {
  return (req, res, next) => {
    // TODO (backend 3):
    //   const key = `${name}:${req.body?.username}`;
    //   look up the bucket, reset it if the window passed,
    //   if locked or count >= max -> res.status(429).json({ error: 'Too many attempts' })
    //   otherwise count++ and next()
    // Decide: count every attempt, or only failures? Document the choice.
    next();
  };
}

export { buckets };
