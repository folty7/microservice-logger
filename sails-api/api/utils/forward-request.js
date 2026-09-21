const axios = require('axios');

const UPSTREAM_TIMEOUT_MS = 10000;

function forwardRequest(url, request) {
  return axios({
    method: request.method,
    url: `${url}${request.path}`,
    data: request.body,
    params: request.query,
    timeout: UPSTREAM_TIMEOUT_MS,
    headers: {
      Authorization: request.headers.authorization,
      'X-Forwarded-For': request.ip,
    },
  });
}

// Forwards the request to the given service and relays its response. Upstream errors
// (4xx/5xx) are passed through unchanged; a timeout or unreachable service becomes 504/502.
async function proxyTo(serviceName, req, res) {
  const serviceUrl = sails.config.services[serviceName].url;

  try {
    const response = await forwardRequest(serviceUrl, req);
    return res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).send(error.response.data);
    }

    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    sails.log.error(`Upstream "${serviceName}" ${timedOut ? 'timed out' : 'unreachable'}: ${error.message}`);

    return res.status(timedOut ? 504 : 502).json({
      name: timedOut ? 'GatewayTimeout' : 'BadGateway',
      message: timedOut ? 'Upstream service timed out' : 'Upstream service unavailable',
      code: timedOut ? 504 : 502,
    });
  }
}

module.exports = { forwardRequest, proxyTo };
