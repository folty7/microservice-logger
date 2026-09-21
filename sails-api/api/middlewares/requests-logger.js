const REDACTED = '***REDACTED***';
const MAX_DEPTH = 10;

// Keys are compared lowercase, so 'Authorization' and 'authorization' both match.
const SENSITIVE_FIELDS = new Set([
  'password', 'token', 'secret', 'authorization', 'apikey', 'creditcard',
  'accesstoken', 'refreshtoken', 'jwt', 'cookie'
]);

// Returns a redacted copy of `value`; sensitive keys are masked at any nesting level.
function redact(value, depth = 0) {
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (depth >= MAX_DEPTH) {
    return '[Truncated]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  const result = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    result[key] = SENSITIVE_FIELDS.has(key.toLowerCase()) ? REDACTED : redact(fieldValue, depth + 1);
  }
  return result;
}

module.exports = async function requestsLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    // This listener runs outside the request's error handling, so an exception
    // here would crash the whole process. Logging must never take the gateway down.
    try {
      const duration = Date.now() - start;
      const safeBody = redact(req.body);

      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: safeBody
      };

      sails.log.info(`${logData.timestamp} ${logData.method} ${logData.url} ${logData.status} (${logData.duration}) ${logData.ip}`);
      // Bodies may contain personal data, so they are only logged at debug level (not in production)
      if (logData.body !== undefined) {
        sails.log.debug(`  body: ${JSON.stringify(logData.body)}`);
      }
    } catch (err) {
      sails.log.error('requestsLogger failed:', err);
    }
  });

  next();
};
