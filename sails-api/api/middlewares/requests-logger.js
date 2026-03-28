const MaskData = require('maskdata');

const maskOptions = {
  maskWith: '***REDACTED***',
  fields: [
    'password', 'token', 'secret', 'authorization', 'apiKey', 'creditCard',
    'accessToken', 'refreshToken', 'jwt', 'cookie', 'Authorization'
  ]
};

module.exports = async function requestsLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Use the masker to hide sensitive info from the body
    const safeBody = (req.body && typeof req.body === 'object') ? MaskData.maskJSONFields(req.body, maskOptions) : req.body;

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


