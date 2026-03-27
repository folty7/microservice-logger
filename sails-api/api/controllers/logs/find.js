const forwardRequest = require('../../utils/forward-request.js');

module.exports = async function find(req, res) {
  try {
    const response = await forwardRequest(sails.config.services.logs.url, req);
    return res.status(response.status).send(response.data);
  } catch (error) {
    return res.status(error.status).send(error.data);
  }
};
