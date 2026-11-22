// OWNER: backend 3 (shared with backend 2 for push spam).
// Simple in-memory rate limiter / lockout. Used for:
//   - /code/verify: a 6-digit code has only 1,000,000 values, so without a
//     limit it can be brute-forced. Lock after ~5 failures.
//   - /push/initiate: refuse push spam (the other half of the MFA-fatigue defense).
//
// Right now this is a pass-through so the app runs. Fill it in.

const buckets = new Map();

// Limit requests per username and IP address.
export function rateLimit(name, { max = 5, windowMs = 60_000 } = {}) {
  return (req, res, next) => {
    const username = String(req.body?.username || "")
      .trim()
      .toLowerCase();

    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Enrollment confirmation uses a logged-in user ID.
    const identity = req.session?.userId || username || "anonymous";
    const key = `${name}:${identity}:${ip}`;

    const now = Date.now();

    let bucket = buckets.get(key);

    // Start a new window if this is the first request
    // or the previous window has expired.
    if (!bucket || now - bucket.firstAt >= windowMs) {
      bucket = {
        count: 0,
        firstAt: now
      };
      buckets.set(key, bucket);
    }

    if (bucket.count >= max) {
      return res.status(429).json({
        error: "Too many attempts. Please try again later."
      });
    }

    // Count every request, including successful attempts.
    bucket.count++;

    next();
  };
}

export { buckets };
