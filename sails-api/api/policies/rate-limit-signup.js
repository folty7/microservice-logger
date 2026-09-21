const createRateLimiter = require('../utils/rate-limiter.js');

module.exports = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });
