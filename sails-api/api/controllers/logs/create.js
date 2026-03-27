const forwardRequest = require('../../utils/forward-request.js');

module.exports = async function create(req, res) {
  if (req.body.type !== 'system' || req.body.level < 3 || !req.body.text.startsWith('Battery')) {
    return res.status(400).send('Bad request');
  }

  const response = await forwardRequest(sails.config.services.logs.url, req);
  return res.status(response.status).send(response.data);
};
