/**
 * Utility function to redact sensitive fields from an object.
 */
function maskSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'apiKey', 'creditCard'];
  const masked = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in masked) {
    if (SENSITIVE_KEYS.includes(key)) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
}

module.exports = async function requestsLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Use the masker to hide sensitive info from the body
    const safeBody = maskSensitiveData(req.body);

    // If you ever need to log the full unmasked body for local debugging,
    // you can swap 'safeBody' for 'req.body' below (use with caution!)
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

    sails.log.debug(`${logData.timestamp} ${logData.method} ${logData.url} ${logData.status} (${logData.duration}) - ${JSON.stringify(logData.body)}`);
  });

  next();
};


