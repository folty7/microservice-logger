const axios = require('axios');

module.exports = function forwardRequest(request) {
  return axios({
    method: request.method,
    url: `http://feathers-logs-service:8081${request.path}`,
    data: request.body,
    params: request.query,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
