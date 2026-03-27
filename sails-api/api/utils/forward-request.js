const axios = require('axios');

module.exports = function forwardRequest(url, request) {
  return axios({
    method: request.method,
    url: `${url}${request.path}`,
    data: request.body,
    params: request.query,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
