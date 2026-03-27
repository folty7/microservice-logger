const forwardRequest = require('../../utils/forward-request.js');

module.exports = async function find(req, res) {
  if (req.query.type !== 'system') {
    return res.status(400).send('Bad request');
  }

  const response = await forwardRequest(req);
  return res.status(response.status).send(response.data);
};
