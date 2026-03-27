const forwardRequest = require('../../utils/forward-request.js');

module.exports = async function create(req, res) {
  const response = await forwardRequest(sails.config.services.users.url, req);
  return res.status(response.status).send(response.data);
};
