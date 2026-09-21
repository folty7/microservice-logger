const createRateLimiter = require('../utils/rate-limiter.js');

// Only failed logins count, so users who sign in successfully are never locked out.
module.exports = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, countFailedOnly: true });
