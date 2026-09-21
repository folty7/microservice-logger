// Minimal in-memory, fixed-window rate limiter for Sails policies.
// State lives in this process only: with several gateway instances, use a shared store (e.g. Redis).
// Note: behind a proxy that does not set a trusted X-Forwarded-For (e.g. the Vite dev proxy),
// all clients share the proxy's IP and therefore one bucket.
module.exports = function createRateLimiter({ windowMs, max, countFailedOnly = false }) {
  const hits = new Map();

  function sweep(now) {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }

  return function rateLimit(req, res, proceed) {
    const now = Date.now();
    if (hits.size > 10000) {
      sweep(now);
    }

    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        name: 'TooManyRequests',
        message: 'Too many attempts, please try again later',
        code: 429,
      });
    }

    if (countFailedOnly) {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          entry.count++;
        }
      });
    } else {
      entry.count++;
    }

    return proceed();
  };
};
